import {
	DB_SCHEMA,
	getDrizzleInstance,
	eq,
	or,
	inArray,
	sql,
	type SQL,
	desc,
	and,
	gte,
	count,
	sum,
	max,
	like
} from '@r8y/db';
import { Array, Effect, pipe } from 'effect';
import { TaggedError } from 'effect/Data';
import { randomBytes } from 'node:crypto';
import { env } from '$env/dynamic/private';

export class DbError extends TaggedError('DbError') {
	constructor(message: string, options?: { cause?: unknown }) {
		super();
		this.message = message;
		this.cause = options?.cause;
	}
}

const generateId = () => randomBytes(16).toString('hex');

const dbService = Effect.gen(function* () {
	const dbUrl = yield* Effect.sync(() => env.MYSQL_URL);

	if (!dbUrl) {
		return yield* Effect.die('MYSQL_URL is not set...');
	}

	const drizzle = yield* Effect.acquireRelease(
		Effect.try(() => getDrizzleInstance(dbUrl)),
		(db) =>
			Effect.sync(() => {
				console.log('Releasing database connection...');
				db.$client.end();
			})
	).pipe(
		Effect.catchAll((err) => {
			console.error('Failed to connect to database...', err);
			return Effect.die('Failed to connect to database...');
		})
	);

	return {
		getAllChannels: () =>
			Effect.gen(function* () {
				const channels = yield* Effect.tryPromise({
					try: () => drizzle.select().from(DB_SCHEMA.channels),
					catch: (err) =>
						new DbError('Failed to get all channels...', {
							cause: err
						})
				});

				return channels;
			}),

		getAllCommentsByVideoId: (ytVideoId: string) =>
			Effect.gen(function* () {
				const comments = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select()
							.from(DB_SCHEMA.comments)
							.where(eq(DB_SCHEMA.comments.ytVideoId, ytVideoId)),
					catch: (err) =>
						new DbError('Failed to get all comments by video id', {
							cause: err
						})
				});

				return comments;
			}),

		getExistingCommentsByIds: (ytCommentIds: string[]) =>
			Effect.gen(function* () {
				const comments = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select()
							.from(DB_SCHEMA.comments)
							.where(inArray(DB_SCHEMA.comments.ytCommentId, ytCommentIds)),
					catch: (err) =>
						new DbError('Failed to get comments by ids', {
							cause: err
						})
				});

				return comments.map((comment) => comment.ytCommentId);
			}),

		getChannel: (ytChannelId: string) =>
			Effect.gen(function* () {
				const channels = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select()
							.from(DB_SCHEMA.channels)
							.where(eq(DB_SCHEMA.channels.ytChannelId, ytChannelId))
							.limit(1),
					catch: (err) =>
						new DbError('Failed to get channel', {
							cause: err
						})
				});

				if (!channels[0]) {
					return yield* Effect.fail(
						new DbError('Channel not found', {
							cause: new Error('Channel not found')
						})
					);
				}

				return channels[0];
			}),

		getVideo: (ytVideoId: string) =>
			Effect.gen(function* () {
				const videos = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select()
							.from(DB_SCHEMA.videos)
							.where(eq(DB_SCHEMA.videos.ytVideoId, ytVideoId))
							.limit(1),
					catch: (err) =>
						new DbError('Failed to get video', {
							cause: err
						})
				});

				return videos[0] || null;
			}),

		getComment: (ytCommentId: string) =>
			Effect.gen(function* () {
				const comments = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select()
							.from(DB_SCHEMA.comments)
							.where(eq(DB_SCHEMA.comments.ytCommentId, ytCommentId))
							.limit(1),
					catch: (err) =>
						new DbError('Failed to get comment', {
							cause: err
						})
				});

				return comments[0] || null;
			}),

		getSponsorByKey: (sponsorKey: string) =>
			Effect.gen(function* () {
				const sponsors = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select()
							.from(DB_SCHEMA.sponsors)
							.where(eq(DB_SCHEMA.sponsors.sponsorKey, sponsorKey))
							.limit(1),
					catch: (err) =>
						new DbError('Failed to get sponsor by key', {
							cause: err
						})
				});

				return sponsors[0] || null;
			}),

		getSponsorById: (sponsorId: string) =>
			Effect.gen(function* () {
				const sponsors = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select()
							.from(DB_SCHEMA.sponsors)
							.where(eq(DB_SCHEMA.sponsors.sponsorId, sponsorId))
							.limit(1),
					catch: (err) =>
						new DbError('Failed to get sponsor by id', {
							cause: err
						})
				});

				return sponsors[0] || null;
			}),

		getSponsorForVideo: (ytVideoId: string) =>
			Effect.gen(function* () {
				const attachments = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select()
							.from(DB_SCHEMA.sponsorToVideos)
							.where(eq(DB_SCHEMA.sponsorToVideos.ytVideoId, ytVideoId))
							.limit(1),
					catch: (err) =>
						new DbError('Failed to get sponsor for video', {
							cause: err
						})
				});

				const attachment = attachments[0] || null;

				if (!attachment) {
					return null;
				}

				const sponsors = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select()
							.from(DB_SCHEMA.sponsors)
							.where(eq(DB_SCHEMA.sponsors.sponsorId, attachment.sponsorId))
							.limit(1),
					catch: (err) =>
						new DbError('Failed to get sponsor by id', {
							cause: err
						})
				});

				return sponsors[0] || null;
			}),

		getSponsorAttachmentByVideoId: (ytVideoId: string) =>
			Effect.gen(function* () {
				const attachments = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select()
							.from(DB_SCHEMA.sponsorToVideos)
							.where(eq(DB_SCHEMA.sponsorToVideos.ytVideoId, ytVideoId))
							.limit(1),
					catch: (err) =>
						new DbError('Failed to get sponsor attachment by video id', {
							cause: err
						})
				});

				return attachments[0] || null;
			}),

		upsertVideo: (data: {
			ytVideoId: string;
			ytChannelId: string;
			title: string;
			description: string;
			thumbnailUrl: string;
			publishedAt: Date;
			viewCount: number;
			likeCount: number;
			commentCount: number;
		}) =>
			Effect.gen(function* () {
				const existing = yield* Effect.gen(function* () {
					const videos = yield* Effect.tryPromise({
						try: () =>
							drizzle
								.select()
								.from(DB_SCHEMA.videos)
								.where(eq(DB_SCHEMA.videos.ytVideoId, data.ytVideoId))
								.limit(1),
						catch: (err) =>
							new DbError('Failed to get video', {
								cause: err
							})
					});

					return videos[0] || null;
				});

				if (existing) {
					yield* Effect.tryPromise({
						try: () =>
							drizzle
								.update(DB_SCHEMA.videos)
								.set({
									viewCount: data.viewCount,
									likeCount: data.likeCount,
									commentCount: data.commentCount
								})
								.where(eq(DB_SCHEMA.videos.ytVideoId, data.ytVideoId)),
						catch: (err) =>
							new DbError('Failed to update video', {
								cause: err
							})
					});

					return { ytVideoId: data.ytVideoId, wasInserted: false };
				} else {
					yield* Effect.tryPromise({
						try: () =>
							drizzle.insert(DB_SCHEMA.videos).values({
								ytVideoId: data.ytVideoId,
								ytChannelId: data.ytChannelId,
								title: data.title,
								description: data.description,
								thumbnailUrl: data.thumbnailUrl,
								publishedAt: data.publishedAt,
								viewCount: data.viewCount,
								likeCount: data.likeCount,
								commentCount: data.commentCount
							}),
						catch: (err) =>
							new DbError('Failed to insert video', {
								cause: err
							})
					});

					return { ytVideoId: data.ytVideoId, wasInserted: true };
				}
			}),

		upsertComment: (data: {
			ytCommentId: string;
			ytVideoId: string;
			text: string;
			author: string;
			publishedAt: Date;
			likeCount: number;
			replyCount: number;
		}) =>
			Effect.gen(function* () {
				const existing = yield* Effect.gen(function* () {
					const comments = yield* Effect.tryPromise({
						try: () =>
							drizzle
								.select()
								.from(DB_SCHEMA.comments)
								.where(eq(DB_SCHEMA.comments.ytCommentId, data.ytCommentId))
								.limit(1),
						catch: (err) =>
							new DbError('Failed to get comment', {
								cause: err
							})
					});

					return comments[0] || null;
				});

				if (existing) {
					yield* Effect.tryPromise({
						try: () =>
							drizzle
								.update(DB_SCHEMA.comments)
								.set({
									likeCount: data.likeCount,
									replyCount: data.replyCount
								})
								.where(eq(DB_SCHEMA.comments.ytCommentId, data.ytCommentId)),
						catch: (err) =>
							new DbError('Failed to update comment', {
								cause: err
							})
					});

					return data.ytCommentId;
				} else {
					yield* Effect.tryPromise({
						try: () =>
							drizzle.insert(DB_SCHEMA.comments).values({
								ytCommentId: data.ytCommentId,
								ytVideoId: data.ytVideoId,
								text: data.text,
								author: data.author,
								publishedAt: data.publishedAt,
								likeCount: data.likeCount,
								replyCount: data.replyCount,
								isEditingMistake: false,
								isSponsorMention: false,
								isQuestion: false,
								isPositiveComment: false,
								isProcessed: false
							}),
						catch: (err) =>
							new DbError('Failed to insert comment', {
								cause: err
							})
					});

					return data.ytCommentId;
				}
			}),

		createSponsor: (data: { ytChannelId: string; sponsorKey: string; name: string }) =>
			Effect.gen(function* () {
				const sponsorId = generateId();

				yield* Effect.tryPromise({
					try: () =>
						drizzle.insert(DB_SCHEMA.sponsors).values({
							sponsorId,
							ytChannelId: data.ytChannelId,
							sponsorKey: data.sponsorKey,
							name: data.name
						}),
					catch: (err) =>
						new DbError('Failed to create sponsor', {
							cause: err
						})
				});

				return sponsorId;
			}),

		attachSponsorToVideo: (data: { sponsorId: string; ytVideoId: string }) =>
			Effect.gen(function* () {
				yield* Effect.tryPromise({
					try: () =>
						drizzle.insert(DB_SCHEMA.sponsorToVideos).values({
							sponsorId: data.sponsorId,
							ytVideoId: data.ytVideoId
						}),
					catch: (err) =>
						new DbError('Failed to attach sponsor to video', {
							cause: err
						})
				});

				return undefined;
			}),

		patchCommentSentiment: (data: {
			ytCommentId: string;
			isEditingMistake: boolean;
			isSponsorMention: boolean;
			isQuestion: boolean;
			isPositiveComment: boolean;
		}) =>
			Effect.gen(function* () {
				yield* Effect.tryPromise({
					try: () =>
						drizzle
							.update(DB_SCHEMA.comments)
							.set({
								isEditingMistake: data.isEditingMistake,
								isSponsorMention: data.isSponsorMention,
								isQuestion: data.isQuestion,
								isPositiveComment: data.isPositiveComment,
								isProcessed: true
							})
							.where(eq(DB_SCHEMA.comments.ytCommentId, data.ytCommentId)),
					catch: (err) =>
						new DbError('Failed to patch comment sentiment', {
							cause: err
						})
				});

				return undefined;
			}),

		logNotification: (data: {
			ytVideoId: string;
			type: 'todoist_video_live' | 'discord_video_live' | 'discord_flagged_comment';
			success: boolean;
			message: string;
			commentId?: string;
		}) =>
			Effect.gen(function* () {
				const notificationId = generateId();

				yield* Effect.tryPromise({
					try: () =>
						drizzle.insert(DB_SCHEMA.notifications).values({
							notificationId,
							ytVideoId: data.ytVideoId,
							type: data.type,
							success: data.success,
							message: data.message,
							commentId: data.commentId || null
						}),
					catch: (err) =>
						new DbError('Failed to log notification', {
							cause: err
						})
				});

				return undefined;
			}),

		bulkUpsertComments: (data: {
			ytVideoId: string;
			comments: Array<{
				ytCommentId: string;
				text: string;
				author: string;
				publishedAt: number;
				likeCount: number;
				replyCount: number;
			}>;
		}) =>
			Effect.gen(function* () {
				const idArray = data.comments.map((comment) => comment.ytCommentId);

				const existingComments = yield* Effect.gen(function* () {
					const comments = yield* Effect.tryPromise({
						try: () =>
							drizzle
								.select()
								.from(DB_SCHEMA.comments)
								.where(inArray(DB_SCHEMA.comments.ytCommentId, idArray)),
						catch: (err) =>
							new DbError('Failed to get comments by ids', {
								cause: err
							})
					});

					return comments.map((comment) => comment.ytCommentId);
				});

				const commentsToInsert = data.comments.filter(
					(comment) => !existingComments.includes(comment.ytCommentId)
				);

				const commentsToUpdate = data.comments.filter((comment) =>
					existingComments.includes(comment.ytCommentId)
				);

				if (commentsToInsert.length > 0) {
					yield* Effect.tryPromise({
						try: () =>
							drizzle.insert(DB_SCHEMA.comments).values(
								commentsToInsert.map((comment) => ({
									ytCommentId: comment.ytCommentId,
									ytVideoId: data.ytVideoId,
									text: comment.text,
									author: comment.author,
									publishedAt: new Date(comment.publishedAt),
									likeCount: comment.likeCount,
									replyCount: comment.replyCount,
									isEditingMistake: false,
									isSponsorMention: false,
									isQuestion: false,
									isPositiveComment: false,
									isProcessed: false
								}))
							),
						catch: (err) =>
							new DbError('Failed to bulk insert comments', {
								cause: err
							})
					});
				}

				if (commentsToUpdate.length > 0) {
					const sqlChunks: SQL[] = [];
					const ids: string[] = [];

					sqlChunks.push(sql`(case`);
					for (const comment of commentsToUpdate) {
						sqlChunks.push(
							sql`when ${DB_SCHEMA.comments.ytCommentId} = ${comment.ytCommentId} then ${comment.likeCount}`
						);
						ids.push(comment.ytCommentId);
					}
					sqlChunks.push(sql`end)`);

					const finalSql: SQL = sql.join(sqlChunks, sql.raw(' '));

					yield* Effect.tryPromise({
						try: () =>
							drizzle
								.update(DB_SCHEMA.comments)
								.set({ likeCount: finalSql })
								.where(inArray(DB_SCHEMA.comments.ytCommentId, ids)),
						catch: (err) =>
							new DbError('Failed to bulk update comments', {
								cause: err
							})
					});
				}

				return undefined;
			}),

		createChannel: (data: {
			channelName: string;
			findSponsorPrompt: string;
			ytChannelId: string;
		}) =>
			Effect.gen(function* () {
				yield* Effect.tryPromise({
					try: () =>
						drizzle.insert(DB_SCHEMA.channels).values({
							name: data.channelName,
							ytChannelId: data.ytChannelId,
							findSponsorPrompt: data.findSponsorPrompt
						}),
					catch: (err) =>
						new DbError('Failed to create channel', {
							cause: err
						})
				});

				return { success: true };
			}),

		getChannelsWithStats: () =>
			Effect.gen(function* () {
				const thirtyDaysAgo = new Date();
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

				const channels = yield* Effect.tryPromise({
					try: () => drizzle.select().from(DB_SCHEMA.channels),
					catch: (err) =>
						new DbError('Failed to get channels', {
							cause: err
						})
				});

				const results = yield* Effect.all(
					channels.map((channel) =>
						Effect.gen(function* () {
							const stats = yield* Effect.tryPromise({
								try: () =>
									drizzle
										.select({
											videoCount: count(DB_SCHEMA.videos.ytVideoId),
											totalViews: sum(DB_SCHEMA.videos.viewCount)
										})
										.from(DB_SCHEMA.videos)
										.where(
											and(
												eq(DB_SCHEMA.videos.ytChannelId, channel.ytChannelId),
												gte(DB_SCHEMA.videos.publishedAt, thirtyDaysAgo)
											)
										),
								catch: (err) =>
									new DbError('Failed to get stats', {
										cause: err
									})
							}).pipe(Effect.map((res) => res[0] || { videoCount: 0, totalViews: 0 }));

							const latestVideo = yield* Effect.tryPromise({
								try: () =>
									drizzle
										.select({
											ytVideoId: DB_SCHEMA.videos.ytVideoId,
											title: DB_SCHEMA.videos.title,
											viewCount: DB_SCHEMA.videos.viewCount
										})
										.from(DB_SCHEMA.videos)
										.where(
											and(
												eq(DB_SCHEMA.videos.ytChannelId, channel.ytChannelId),
												gte(DB_SCHEMA.videos.publishedAt, thirtyDaysAgo)
											)
										)
										.orderBy(desc(DB_SCHEMA.videos.publishedAt))
										.limit(1),
								catch: (err) =>
									new DbError('Failed to get latest video', {
										cause: err
									})
							}).pipe(Effect.map((res) => res[0] || null));

							return {
								...channel,
								videoCount: Number(stats.videoCount) || 0,
								totalViews: Number(stats.totalViews) || 0,
								latestVideo
							};
						})
					),
					{ concurrency: 'unbounded' }
				);

				return results;
			}),

		getLast7VideosByViews: (ytChannelId: string) =>
			Effect.gen(function* () {
				const videos = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select({
								video: DB_SCHEMA.videos,
								sponsor: DB_SCHEMA.sponsors
							})
							.from(DB_SCHEMA.videos)
							.leftJoin(
								DB_SCHEMA.sponsorToVideos,
								eq(DB_SCHEMA.sponsorToVideos.ytVideoId, DB_SCHEMA.videos.ytVideoId)
							)
							.leftJoin(
								DB_SCHEMA.sponsors,
								eq(DB_SCHEMA.sponsors.sponsorId, DB_SCHEMA.sponsorToVideos.sponsorId)
							)
							.where(and(eq(DB_SCHEMA.videos.ytChannelId, ytChannelId)))
							.orderBy(desc(DB_SCHEMA.videos.publishedAt))
							.limit(7),
					catch: (err) =>
						new DbError('Failed to get last 7 videos', {
							cause: err
						})
				});

				const channel = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select()
							.from(DB_SCHEMA.channels)
							.where(eq(DB_SCHEMA.channels.ytChannelId, ytChannelId))
							.limit(1),
					catch: (err) =>
						new DbError('Failed to get channel', {
							cause: err
						})
				}).pipe(Effect.map((res) => res[0]));

				if (!channel) {
					return yield* Effect.fail(new DbError('Channel not found'));
				}

				const formattedVideos = videos.map((v) => ({
					...v.video,
					sponsor: v.sponsor || null
				}));

				const totalViews = formattedVideos.reduce((sum, v) => sum + v.viewCount, 0);

				return {
					channel,
					videos: formattedVideos,
					totalViews
				};
			}),

		getChannelVideos: (args: { ytChannelId: string; limit: number }) =>
			Effect.gen(function* () {
				const { ytChannelId, limit } = args;
				const videos = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select({
								video: DB_SCHEMA.videos,
								sponsor: DB_SCHEMA.sponsors
							})
							.from(DB_SCHEMA.videos)
							.limit(limit)
							.leftJoin(
								DB_SCHEMA.sponsorToVideos,
								eq(DB_SCHEMA.sponsorToVideos.ytVideoId, DB_SCHEMA.videos.ytVideoId)
							)
							.leftJoin(
								DB_SCHEMA.sponsors,
								eq(DB_SCHEMA.sponsors.sponsorId, DB_SCHEMA.sponsorToVideos.sponsorId)
							)
							.where(eq(DB_SCHEMA.videos.ytChannelId, ytChannelId))
							.orderBy(desc(DB_SCHEMA.videos.publishedAt)),
					catch: (err) =>
						new DbError('Failed to get channel videos', {
							cause: err
						})
				});

				return videos.map((v) => ({
					...v.video,
					sponsor: v.sponsor || null
				}));
			}),

		getChannelNotifications: (ytChannelId: string) =>
			Effect.gen(function* () {
				const notifications = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select({
								notification: DB_SCHEMA.notifications,
								videoTitle: DB_SCHEMA.videos.title
							})
							.from(DB_SCHEMA.notifications)
							.innerJoin(
								DB_SCHEMA.videos,
								eq(DB_SCHEMA.videos.ytVideoId, DB_SCHEMA.notifications.ytVideoId)
							)
							.where(eq(DB_SCHEMA.videos.ytChannelId, ytChannelId))
							.orderBy(desc(DB_SCHEMA.notifications.createdAt))
							.limit(50),
					catch: (err) =>
						new DbError('Failed to get channel notifications', {
							cause: err
						})
				});

				return notifications.map((n) => ({
					...n.notification,
					videoTitle: n.videoTitle
				}));
			}),

		getChannelSponsors: (ytChannelId: string) =>
			Effect.gen(function* () {
				const sponsors = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select({
								sponsor: DB_SCHEMA.sponsors,
								totalViews: sum(DB_SCHEMA.videos.viewCount),
								totalVideos: count(DB_SCHEMA.videos.ytVideoId),
								lastVideoPublishedAt: max(DB_SCHEMA.videos.publishedAt)
							})
							.from(DB_SCHEMA.sponsors)
							.leftJoin(
								DB_SCHEMA.sponsorToVideos,
								eq(DB_SCHEMA.sponsorToVideos.sponsorId, DB_SCHEMA.sponsors.sponsorId)
							)
							.leftJoin(
								DB_SCHEMA.videos,
								eq(DB_SCHEMA.videos.ytVideoId, DB_SCHEMA.sponsorToVideos.ytVideoId)
							)
							.where(eq(DB_SCHEMA.sponsors.ytChannelId, ytChannelId))
							.groupBy(DB_SCHEMA.sponsors.sponsorId),
					catch: (err) =>
						new DbError('Failed to get channel sponsors', {
							cause: err
						})
				});

				return sponsors.map((s) => {
					const lastPublishedAt = s.lastVideoPublishedAt ? new Date(s.lastVideoPublishedAt) : null;
					const daysAgo = lastPublishedAt
						? Math.floor((Date.now() - lastPublishedAt.getTime()) / (1000 * 60 * 60 * 24))
						: null;

					return {
						...s.sponsor,
						totalViews: Number(s.totalViews) || 0,
						totalVideos: Number(s.totalVideos) || 0,
						lastVideoPublishedAt: lastPublishedAt?.getTime() || null,
						lastVideoPublishedDaysAgo: daysAgo
					};
				});
			}),

		getSponsorDetails: (sponsorId: string) =>
			Effect.gen(function* () {
				const sponsor = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select()
							.from(DB_SCHEMA.sponsors)
							.where(eq(DB_SCHEMA.sponsors.sponsorId, sponsorId))
							.limit(1),
					catch: (err) =>
						new DbError('Failed to get sponsor', {
							cause: err
						})
				}).pipe(Effect.map((res) => res[0]));

				if (!sponsor) {
					return yield* Effect.fail(new DbError('Sponsor not found'));
				}

				const videos = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select({
								video: DB_SCHEMA.videos
							})
							.from(DB_SCHEMA.sponsorToVideos)
							.innerJoin(
								DB_SCHEMA.videos,
								eq(DB_SCHEMA.videos.ytVideoId, DB_SCHEMA.sponsorToVideos.ytVideoId)
							)
							.where(eq(DB_SCHEMA.sponsorToVideos.sponsorId, sponsorId))
							.orderBy(desc(DB_SCHEMA.videos.publishedAt)),
					catch: (err) =>
						new DbError('Failed to get sponsor videos', {
							cause: err
						})
				}).pipe(Effect.map((res) => res.map((v) => v.video)));

				const videoIds = videos.map((v) => v.ytVideoId);

				const sponsorMentionComments =
					videoIds.length > 0
						? yield* Effect.tryPromise({
								try: () =>
									drizzle
										.select({
											comment: DB_SCHEMA.comments,
											videoTitle: DB_SCHEMA.videos.title
										})
										.from(DB_SCHEMA.comments)
										.innerJoin(
											DB_SCHEMA.videos,
											eq(DB_SCHEMA.videos.ytVideoId, DB_SCHEMA.comments.ytVideoId)
										)
										.where(
											and(
												inArray(DB_SCHEMA.comments.ytVideoId, videoIds),
												eq(DB_SCHEMA.comments.isSponsorMention, true)
											)
										)
										.orderBy(desc(DB_SCHEMA.comments.publishedAt)),
								catch: (err) =>
									new DbError('Failed to get sponsor mention comments', {
										cause: err
									})
							}).pipe(
								Effect.map((res) => res.map((r) => ({ ...r.comment, videoTitle: r.videoTitle })))
							)
						: [];

				const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0);
				const totalAds = videos.length;
				const lastPublishDate =
					videos.length > 0 ? (videos[0]?.publishedAt.getTime() ?? null) : null;

				return {
					sponsor,
					videos,
					sponsorMentionComments,
					stats: {
						totalViews,
						totalAds,
						lastPublishDate
					}
				};
			}),

		searchVideosAndSponsors: (args: { searchQuery: string; channelId: string }) =>
			Effect.gen(function* () {
				const { searchQuery, channelId } = args;

				if (!searchQuery) {
					return {
						results: []
					};
				}

				const videosEffect = channelId
					? pipe(
							Effect.tryPromise({
								try: () =>
									drizzle
										.select()
										.from(DB_SCHEMA.videos)
										.where(
											and(
												or(
													like(DB_SCHEMA.videos.title, `%${searchQuery}%`),
													like(DB_SCHEMA.videos.ytVideoId, `%${searchQuery}%`)
												),
												eq(DB_SCHEMA.videos.ytChannelId, channelId)
											)
										)
										.limit(4),
								catch: (err) =>
									new DbError('Failed to search videos', {
										cause: err
									})
							}),
							Effect.map((videos) =>
								Array.map(videos, (video) => ({
									type: 'video' as const,
									data: video
								}))
							)
						)
					: Effect.succeed([]);

				const channelsEffect = pipe(
					Effect.tryPromise({
						try: () =>
							drizzle
								.select()
								.from(DB_SCHEMA.channels)
								.where(
									or(
										like(DB_SCHEMA.channels.name, `%${searchQuery}%`),
										like(DB_SCHEMA.channels.ytChannelId, `%${searchQuery}%`)
									)
								)
								.limit(4),
						catch: (err) =>
							new DbError(`Failed to search channels ${err}`, {
								cause: err
							})
					}),
					Effect.map((channels) =>
						Array.map(channels, (channel) => ({
							type: 'channel' as const,
							data: channel
						}))
					)
				);

				const sponsorsEffect = channelId
					? pipe(
							Effect.tryPromise({
								try: () =>
									drizzle
										.select()
										.from(DB_SCHEMA.sponsors)
										.where(
											and(
												or(
													like(DB_SCHEMA.sponsors.sponsorKey, `%${searchQuery}%`),
													like(DB_SCHEMA.sponsors.name, `%${searchQuery}%`)
												),
												eq(DB_SCHEMA.sponsors.ytChannelId, channelId)
											)
										)
										.limit(4),
								catch: (err) =>
									new DbError(`Failed to search sponsors ${err}`, {
										cause: err
									})
							}),
							Effect.map((sponsors) =>
								Array.map(sponsors, (sponsor) => ({
									type: 'sponsor' as const,
									data: sponsor
								}))
							)
						)
					: Effect.succeed([]);

				const [videos, sponsors, channels] = yield* Effect.all(
					[videosEffect, sponsorsEffect, channelsEffect],
					{
						concurrency: 'unbounded'
					}
				);

				const results = [channels, sponsors, videos].flat();

				return {
					results
				};
			}),

		getVideoDetails: (ytVideoId: string) =>
			Effect.gen(function* () {
				const video = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select()
							.from(DB_SCHEMA.videos)
							.where(eq(DB_SCHEMA.videos.ytVideoId, ytVideoId))
							.limit(1),
					catch: (err) =>
						new DbError('Failed to get video', {
							cause: err
						})
				}).pipe(Effect.map((res) => res[0]));

				if (!video) {
					return yield* Effect.fail(new DbError('Video not found'));
				}

				const channel = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select()
							.from(DB_SCHEMA.channels)
							.where(eq(DB_SCHEMA.channels.ytChannelId, video.ytChannelId))
							.limit(1),
					catch: (err) =>
						new DbError('Failed to get channel', {
							cause: err
						})
				}).pipe(Effect.map((res) => res[0] || null));

				const sponsor = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select({
								sponsor: DB_SCHEMA.sponsors
							})
							.from(DB_SCHEMA.sponsorToVideos)
							.innerJoin(
								DB_SCHEMA.sponsors,
								eq(DB_SCHEMA.sponsors.sponsorId, DB_SCHEMA.sponsorToVideos.sponsorId)
							)
							.where(eq(DB_SCHEMA.sponsorToVideos.ytVideoId, ytVideoId))
							.limit(1),
					catch: (err) =>
						new DbError('Failed to get sponsor', {
							cause: err
						})
				}).pipe(Effect.map((res) => res[0]?.sponsor || null));

				const comments = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select()
							.from(DB_SCHEMA.comments)
							.where(eq(DB_SCHEMA.comments.ytVideoId, ytVideoId))
							.orderBy(desc(DB_SCHEMA.comments.publishedAt)),
					catch: (err) =>
						new DbError('Failed to get comments', {
							cause: err
						})
				});

				const notifications = yield* Effect.tryPromise({
					try: () =>
						drizzle
							.select()
							.from(DB_SCHEMA.notifications)
							.where(eq(DB_SCHEMA.notifications.ytVideoId, ytVideoId))
							.orderBy(desc(DB_SCHEMA.notifications.createdAt)),
					catch: (err) =>
						new DbError('Failed to get notifications', {
							cause: err
						})
				});

				return {
					video,
					channel,
					sponsor,
					comments,
					notifications
				};
			})
	};
});

export class DbService extends Effect.Service<DbService>()('DbService', {
	scoped: dbService
}) {}
