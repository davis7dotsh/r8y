import { Effect, Console, Ref } from 'effect';
import { DbService } from './db';
import { YoutubeService } from './youtube';
import { AiService } from './ai';
import { DiscordService } from './notifications/discord';
import { TodoistService } from './notifications/todoist';
import { TaggedError } from 'effect/Data';

class SyncVideoError extends TaggedError('SyncVideoError') {
	constructor(message: string, options?: { cause?: unknown }) {
		super();
		this.message = message;
		this.cause = options?.cause;
	}
}

const channelSyncService = Effect.gen(function* () {
	const db = yield* DbService;
	const youtube = yield* YoutubeService;
	const ai = yield* AiService;
	const discord = yield* DiscordService;
	const todoist = yield* TodoistService;

	const syncVideo = (args: { ytVideoId: string; isBackfill?: boolean }) =>
		Effect.gen(function* () {
			const videoDetails = yield* youtube.getVideoDetails({ ytVideoId: args.ytVideoId });

			const upsertVideoResult = yield* db.upsertVideo({
				ytVideoId: args.ytVideoId,
				ytChannelId: videoDetails.channelId,
				title: videoDetails.title,
				description: videoDetails.description,
				thumbnailUrl: videoDetails.thumbnailUrl,
				publishedAt: new Date(videoDetails.publishedAt),
				viewCount: videoDetails.viewCount,
				likeCount: videoDetails.likeCount,
				commentCount: videoDetails.commentCount
			});

			const { wasInserted } = upsertVideoResult;

			const channel = yield* db.getChannel(videoDetails.channelId);

			if (!channel) {
				return yield* Effect.fail(new SyncVideoError('Channel not found'));
			}

			const currentSponsor = yield* db.getSponsorForVideo(args.ytVideoId);

			let sponsor: { name: string } = currentSponsor
				? { name: currentSponsor.name }
				: { name: 'No sponsor' };

			if (!currentSponsor) {
				const sponsorResult = yield* ai
					.getSponsor({
						sponsorPrompt: channel.findSponsorPrompt,
						videoDescription: videoDetails.description
					})
					.pipe(Effect.either);

				if (sponsorResult._tag === 'Right') {
					sponsor = { name: sponsorResult.right.sponsorName };

					const existingSponsor = yield* db.getSponsorByKey(sponsorResult.right.sponsorKey);

					if (existingSponsor) {
						yield* db.attachSponsorToVideo({
							sponsorId: existingSponsor.sponsorId,
							ytVideoId: args.ytVideoId
						});
					} else {
						const newSponsorId = yield* db.createSponsor({
							ytChannelId: channel.ytChannelId,
							sponsorKey: sponsorResult.right.sponsorKey,
							name: sponsorResult.right.sponsorName
						});

						yield* db.attachSponsorToVideo({
							sponsorId: newSponsorId,
							ytVideoId: args.ytVideoId
						});
					}
				}
			}

			if (wasInserted) {
				const options = args.isBackfill !== undefined ? { isBackfill: args.isBackfill } : {};
				yield* discord.sendVideoLiveToDiscord(
					{
						ytVideoId: args.ytVideoId,
						title: videoDetails.title
					},
					sponsor,
					options
				);
				yield* todoist.sendVideoLiveToTodoist(
					{
						ytVideoId: args.ytVideoId,
						title: videoDetails.title
					},
					sponsor,
					options
				);
			}

			const comments = yield* youtube.getVideoComments({
				ytVideoId: args.ytVideoId,
				maxResults: 100
			});

			yield* db.bulkUpsertComments({
				ytVideoId: args.ytVideoId,
				comments: comments.map((comment) => ({
					ytCommentId: comment.ytCommentId,
					text: comment.text,
					author: comment.author,
					publishedAt: comment.publishedAt,
					likeCount: comment.likeCount,
					replyCount: comment.replyCount
				}))
			});

			const allComments = yield* db.getAllCommentsByVideoId(args.ytVideoId);

			const handleCommentSentiment = (comment: {
				ytCommentId: string;
				text: string;
				author: string;
				likeCount: number;
				replyCount: number;
				isProcessed: boolean;
			}) =>
				Effect.gen(function* () {
					if (comment.isProcessed) {
						return;
					}

					const classification = yield* ai.classifyComment({
						comment: comment.text,
						videoSponsor: sponsor.name
					});

					yield* db.patchCommentSentiment({
						ytCommentId: comment.ytCommentId,
						isEditingMistake: classification.isEditingMistake,
						isSponsorMention: classification.isSponsorMention,
						isQuestion: classification.isQuestion,
						isPositiveComment: classification.isPositiveComment
					});
				}).pipe(
					Effect.catchAll((err) =>
						Effect.gen(function* () {
							const errorMessage = err instanceof Error ? err.message : String(err);
							yield* Console.error(`Failed to process comment sentiment: ${errorMessage}`);
						})
					)
				);

			yield* Effect.forEach(allComments, handleCommentSentiment, { concurrency: 10 });
		}).pipe(
			Effect.catchTag(
				'DbError',
				(err) => new SyncVideoError(`DB ERROR: ${err.message}`, { cause: err.cause })
			),
			Effect.catchTag(
				'YoutubeError',
				(err) => new SyncVideoError(`YOUTUBE ERROR: ${err.message}`, { cause: err.cause })
			)
		);

	const syncAllChannels = () =>
		Effect.gen(function* () {
			const start = performance.now();
			const channels = yield* db.getAllChannels();

			let successCount = 0;
			let errorCount = 0;

			yield* Effect.forEach(
				channels,
				(channel) =>
					Effect.gen(function* () {
						const recentVideos = yield* youtube
							.getRecentVideosForChannel({
								ytChannelId: channel.ytChannelId
							})
							.pipe(Effect.either);

						if (recentVideos._tag === 'Left') {
							console.error('LIVE CRAWLER: Failed to get recent videos', recentVideos.left);
							return;
						}

						yield* Effect.forEach(
							recentVideos.right,
							(video) =>
								Effect.gen(function* () {
									console.log(`Syncing video ${video.videoId} - ${video.title}`);
									const result = yield* syncVideo({ ytVideoId: video.videoId }).pipe(Effect.either);

									if (result._tag === 'Right') {
										successCount++;
										console.log(`Synced video ${video.videoId} - ${video.title}`);
									} else {
										errorCount++;
										console.error('LIVE CRAWLER: Failed to sync video', result.left);
									}
								}),
							{ concurrency: 4 }
						);
					}),
				{ concurrency: 3 }
			);

			yield* Console.log(
				`LIVE CRAWLER COMPLETED: ${successCount} videos synced, ${errorCount} videos failed`
			);
			yield* Console.log(`LIVE CRAWLER TOOK ${performance.now() - start}ms`);
		});

	const backfillChannel = (args: { ytChannelId: string; maxVideos?: number }) =>
		Effect.gen(function* () {
			const start = performance.now();
			yield* Console.log(`BACKFILL: Starting backfill for channel ${args.ytChannelId}`);

			const channel = yield* db.getChannel(args.ytChannelId);
			if (!channel) {
				return yield* Effect.fail(new SyncVideoError('Channel not found'));
			}

			const videoIds = yield* youtube.getVideosForChannel({
				ytChannelId: args.ytChannelId,
				maxResults: args.maxVideos ?? 1000
			});

			const totalVideos = videoIds.length;
			yield* Console.log(`BACKFILL: Found ${totalVideos} videos to backfill`);

			const successCount = yield* Ref.make(0);
			const errorCount = yield* Ref.make(0);

			// Process each video with backfill flag set to true
			yield* Effect.forEach(
				videoIds,
				(videoId) =>
					Effect.gen(function* () {
						const result = yield* syncVideo({ ytVideoId: videoId, isBackfill: true }).pipe(
							Effect.either
						);

						if (result._tag === 'Right') {
							const newSuccess = yield* Ref.updateAndGet(successCount, (n) => n + 1);
							const errors = yield* Ref.get(errorCount);
							const completed = newSuccess + errors;
							yield* Console.log(`BACKFILL: [${completed}/${totalVideos}] Synced video ${videoId}`);
						} else {
							const newErrors = yield* Ref.updateAndGet(errorCount, (n) => n + 1);
							const successes = yield* Ref.get(successCount);
							const completed = successes + newErrors;
							yield* Console.error(
								`BACKFILL: [${completed}/${totalVideos}] Failed video ${videoId}: ${result.left}`
							);
						}
					}),
				{ concurrency: 4 }
			);

			const finalSuccess = yield* Ref.get(successCount);
			const finalErrors = yield* Ref.get(errorCount);
			yield* Console.log(
				`BACKFILL COMPLETED: ${finalSuccess} videos synced, ${finalErrors} videos failed`
			);
			yield* Console.log(`BACKFILL TOOK ${performance.now() - start}ms`);
		});

	return {
		syncVideo,
		syncAllChannels,
		backfillChannel
	};
});

export class ChannelSyncService extends Effect.Service<ChannelSyncService>()('ChannelSyncService', {
	dependencies: [
		YoutubeService.Default,
		AiService.Default,
		DiscordService.Default,
		TodoistService.Default
	],
	effect: channelSyncService
}) {}

export * from './db';
