import { DB_SCHEMA, getDrizzleInstance, eq, inArray, sql } from '@r8y/db';
import { Effect } from 'effect';
import { TaggedError } from 'effect/Data';
import { randomBytes } from 'node:crypto';

class DbError extends TaggedError('DbError') {
	constructor(message: string, options?: { cause?: unknown }) {
		super();
		this.message = message;
		this.cause = options?.cause;
	}
}

const generateId = () => randomBytes(16).toString('hex');

const dbService = Effect.gen(function* () {
	const dbUrl = yield* Effect.sync(() => Bun.env.DATABASE_URL);

	if (!dbUrl) {
		return yield* Effect.die('DATABASE_URL is not set...');
	}

	const drizzle = yield* Effect.acquireRelease(
		Effect.try(() => getDrizzleInstance(dbUrl)),
		(db) =>
			Effect.sync(() => {
				console.log('Closing database connection...');
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

				return channels[0] || null;
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
				if (data.comments.length === 0) {
					return undefined;
				}

				yield* Effect.tryPromise({
					try: () =>
						drizzle
							.insert(DB_SCHEMA.comments)
							.values(
								data.comments.map((comment) => ({
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
							)
							.onConflictDoUpdate({
								target: DB_SCHEMA.comments.ytCommentId,
								set: {
									likeCount: sql`excluded.like_count`,
									replyCount: sql`excluded.reply_count`
								}
							}),
					catch: (err) =>
						new DbError('Failed to bulk upsert comments', {
							cause: err
						})
				});

				return undefined;
			})
	};
});

export class DbService extends Effect.Service<DbService>()('DbService', {
	scoped: dbService
}) {}
