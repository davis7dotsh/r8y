import { Client, GatewayIntentBits } from 'discord.js';
import { Effect } from 'effect';
import { DbService } from '../db';
import { TaggedError } from 'effect/Data';

class DiscordError extends TaggedError('DiscordError') {
	constructor(message: string, options?: { cause?: unknown }) {
		super();
		this.message = message;
		this.cause = options?.cause;
	}
}

type VideoLiveMessageFields = {
	videoUrl: string;
	videoTitle: string;
	videoSponsor: string | null;
};

const videoLiveMessageTemplate = (fields: VideoLiveMessageFields) =>
	`<@&${Bun.env.DISCORD_ROLE_ID}> video just went live: *${fields.videoTitle}*

video sponsor: **${fields.videoSponsor || 'no sponsor'}**

video link: ${fields.videoUrl}

\`\`\`
────────────────────────────────────────
\`\`\`
`;

type FlaggedCommentMessageFields = {
	commentUrl: string;
	commentText: string;
	commentLikeCount: number | null;
	commentAuthorName: string | null;
	commentLeftAt: number;
};

const flaggedCommentMessageTemplate = (fields: FlaggedCommentMessageFields) => `
<@&${Bun.env.DISCORD_ROLE_ID}> flagged comment from *${fields.commentAuthorName || 'unknown'}*

left at: ${new Date(fields.commentLeftAt).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}

comment text: **${fields.commentText}**

like count: ${fields.commentLikeCount || 'unknown'}

comment link: <${fields.commentUrl}>

\`\`\`
────────────────────────────────────────
\`\`\`
`;

const discordService = Effect.gen(function* () {
	const discordBotToken = yield* Effect.sync(() => Bun.env.DISCORD_BOT_TOKEN);
	const discordChannelId = yield* Effect.sync(() => Bun.env.DISCORD_CHANNEL_ID);

	if (!discordBotToken) {
		return yield* Effect.die('DISCORD_BOT_TOKEN is not set');
	}

	if (!discordChannelId) {
		return yield* Effect.die('DISCORD_CHANNEL_ID is not set');
	}

	const client = yield* Effect.acquireRelease(
		Effect.sync(
			() =>
				new Client({
					intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds]
				})
		),
		(client) =>
			Effect.tryPromise(() => client.destroy()).pipe(
				Effect.catchAll((err) => {
					console.error('Failed to destroy Discord client', err);
					return Effect.succeed(null);
				})
			)
	);

	yield* Effect.tryPromise({
		try: () => client.login(discordBotToken),
		catch: (err) => new DiscordError('Failed to login to Discord', { cause: err })
	}).pipe(Effect.tap((res) => Effect.log(`Logged in to Discord: ${res}`)));

	const db = yield* DbService;

	const sendMessage = (message: string) =>
		Effect.gen(function* () {
			const channel = yield* Effect.tryPromise({
				try: () => client.channels.fetch(discordChannelId),
				catch: (err) => new DiscordError('Failed to fetch channel', { cause: err })
			});

			if (!channel || !channel.isSendable()) {
				return yield* Effect.fail(new DiscordError('Channel not found or not sendable'));
			}

			yield* Effect.tryPromise({
				try: () => channel.send(message) as Promise<any>,
				catch: (err) => new DiscordError('Failed to send message', { cause: err })
			});
		});

	return {
		sendVideoLiveToDiscord: (
			video: {
				ytVideoId: string;
				title: string;
			},
			sponsor: { name: string } | null,
			options?: { isBackfill?: boolean }
		) =>
			Effect.gen(function* () {
				// Skip sending notification if this is a backfill operation
				if (options?.isBackfill) {
					yield* Effect.log('Skipping Discord notification for backfill video');
					return;
				}

				const videoUrl = `https://www.youtube.com/watch?v=${video.ytVideoId}`;
				const message = videoLiveMessageTemplate({
					videoUrl,
					videoTitle: video.title,
					videoSponsor: sponsor?.name || null
				});

				yield* sendMessage(message).pipe(
					Effect.tap(() =>
						db.logNotification({
							ytVideoId: video.ytVideoId,
							type: 'discord_video_live',
							success: true,
							message: 'Message sent to Discord'
						})
					),
					Effect.catchTag('DiscordError', (err) => {
						const errorMessage = err.message;
						console.error('DISCORD, failed to send message', errorMessage);
						return db.logNotification({
							ytVideoId: video.ytVideoId,
							type: 'discord_video_live',
							success: false,
							message: `Failed to send message to Discord: ${errorMessage}`
						});
					})
				);
			}),

		sendFlaggedCommentToDiscord: (
			comment: {
				ytCommentId: string;
				text: string;
				likeCount: number;
				author: string;
				publishedAt: Date;
			},
			video: {
				ytVideoId: string;
			}
		) =>
			Effect.gen(function* () {
				const commentUrl = `https://www.youtube.com/watch?v=${video.ytVideoId}&lc=${comment.ytCommentId}`;
				const message = flaggedCommentMessageTemplate({
					commentUrl,
					commentText: comment.text,
					commentLikeCount: comment.likeCount,
					commentAuthorName: comment.author,
					commentLeftAt: comment.publishedAt.getTime()
				});

				yield* sendMessage(message).pipe(
					Effect.tap(() =>
						db.logNotification({
							ytVideoId: video.ytVideoId,
							type: 'discord_flagged_comment',
							success: true,
							message: 'Flagged comment message sent to Discord',
							commentId: comment.ytCommentId
						})
					),
					Effect.catchTag('DiscordError', (err) => {
						const errorMessage = err.message;
						console.error('DISCORD, failed to send flagged comment message', errorMessage);
						return db.logNotification({
							ytVideoId: video.ytVideoId,
							type: 'discord_flagged_comment',
							success: false,
							message: `Failed to send flagged comment message to Discord: ${errorMessage}`,
							commentId: comment.ytCommentId
						});
					})
				);
			})
	};
});

export class DiscordService extends Effect.Service<DiscordService>()('DiscordService', {
	scoped: discordService
}) {}
