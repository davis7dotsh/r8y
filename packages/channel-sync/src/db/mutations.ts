import { ok, Ok, ResultAsync } from 'neverthrow';
import { randomBytes } from 'crypto';
import { dbClient } from '.';
import { DB_SCHEMA, eq, inArray, sql, SQL } from '@r8y/db';
import { DB_QUERIES } from './queries';

const generateId = () => randomBytes(16).toString('hex');

export const DB_MUTATIONS = {
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
	}) => {
		return DB_QUERIES.getVideo(data.ytVideoId).andThen((existing) => {
			if (existing) {
				return ResultAsync.fromPromise(
					dbClient
						.update(DB_SCHEMA.videos)
						.set({
							viewCount: data.viewCount,
							likeCount: data.likeCount,
							commentCount: data.commentCount
						})
						.where(eq(DB_SCHEMA.videos.ytVideoId, data.ytVideoId)),
					() => new Error('Failed to update video')
				).map(() => ({ ytVideoId: data.ytVideoId, wasInserted: false }));
			} else {
				return ResultAsync.fromPromise(
					dbClient.insert(DB_SCHEMA.videos).values({
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
					() => new Error('Failed to insert video')
				).map(() => ({ ytVideoId: data.ytVideoId, wasInserted: true }));
			}
		});
	},

	upsertComment: (data: {
		ytCommentId: string;
		ytVideoId: string;
		text: string;
		author: string;
		publishedAt: Date;
		likeCount: number;
		replyCount: number;
	}) => {
		return DB_QUERIES.getComment(data.ytCommentId).andThen((existing) => {
			if (existing) {
				return ResultAsync.fromPromise(
					dbClient
						.update(DB_SCHEMA.comments)
						.set({
							likeCount: data.likeCount,
							replyCount: data.replyCount
						})
						.where(eq(DB_SCHEMA.comments.ytCommentId, data.ytCommentId)),
					() => new Error('Failed to update comment')
				).map(() => data.ytCommentId);
			} else {
				return ResultAsync.fromPromise(
					dbClient.insert(DB_SCHEMA.comments).values({
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
					() => new Error('Failed to insert comment')
				).map(() => data.ytCommentId);
			}
		});
	},

	createSponsor: (data: { ytChannelId: string; sponsorKey: string; name: string }) => {
		const sponsorId = generateId();
		return ResultAsync.fromPromise(
			dbClient.insert(DB_SCHEMA.sponsors).values({
				sponsorId,
				ytChannelId: data.ytChannelId,
				sponsorKey: data.sponsorKey,
				name: data.name
			}),
			() => new Error('Failed to create sponsor')
		).map(() => sponsorId);
	},

	attachSponsorToVideo: (data: { sponsorId: string; ytVideoId: string }) => {
		return ResultAsync.fromPromise(
			dbClient.insert(DB_SCHEMA.sponsorToVideos).values({
				sponsorId: data.sponsorId,
				ytVideoId: data.ytVideoId
			}),
			() => new Error('Failed to attach sponsor to video')
		).map(() => undefined);
	},

	patchCommentSentiment: (data: {
		ytCommentId: string;
		isEditingMistake: boolean;
		isSponsorMention: boolean;
		isQuestion: boolean;
		isPositiveComment: boolean;
	}) => {
		return ResultAsync.fromPromise(
			dbClient
				.update(DB_SCHEMA.comments)
				.set({
					isEditingMistake: data.isEditingMistake,
					isSponsorMention: data.isSponsorMention,
					isQuestion: data.isQuestion,
					isPositiveComment: data.isPositiveComment,
					isProcessed: true
				})
				.where(eq(DB_SCHEMA.comments.ytCommentId, data.ytCommentId)),
			() => new Error('Failed to patch comment sentiment')
		).map(() => undefined);
	},

	logNotification: (data: {
		ytVideoId: string;
		type: 'todoist_video_live' | 'discord_video_live' | 'discord_flagged_comment';
		success: boolean;
		message: string;
		commentId?: string;
	}) => {
		const notificationId = generateId();
		return ResultAsync.fromPromise(
			dbClient.insert(DB_SCHEMA.notifications).values({
				notificationId,
				ytVideoId: data.ytVideoId,
				type: data.type,
				success: data.success,
				message: data.message,
				commentId: data.commentId || null
			}),
			() => new Error('Failed to log notification')
		).map(() => undefined);
	},

	bulkUpsertComments: async (data: {
		ytVideoId: string;
		comments: Array<{
			ytCommentId: string;
			text: string;
			author: string;
			publishedAt: number;
			likeCount: number;
			replyCount: number;
		}>;
	}) => {
		const idArray = data.comments.map((comment) => comment.ytCommentId);
		const existingCommentIdsResult = await DB_QUERIES.getExistingCommentsByIds(idArray);

		if (existingCommentIdsResult.isErr()) {
			return existingCommentIdsResult;
		}

		const existingCommentIds = existingCommentIdsResult.value;

		const commentsToInsert = data.comments.filter(
			(comment) => !existingCommentIds.includes(comment.ytCommentId)
		);

		const commentsToUpdate = data.comments.filter((comment) =>
			existingCommentIds.includes(comment.ytCommentId)
		);

		if (commentsToInsert.length > 0) {
			const insertResult = await ResultAsync.fromPromise(
				dbClient.insert(DB_SCHEMA.comments).values(
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
				() => new Error('Failed to bulk insert comments')
			).map(() => undefined);

			if (insertResult.isErr()) {
				return insertResult;
			}
		}

		const updateCommentsInputs = commentsToUpdate.map((comment) => {
			return {
				ytCommentId: comment.ytCommentId,
				likeCount: comment.likeCount
			};
		});

		if (updateCommentsInputs.length > 0) {
			const sqlChunks: SQL[] = [];
			const ids: string[] = [];

			sqlChunks.push(sql`(case`);
			for (const input of updateCommentsInputs) {
				sqlChunks.push(
					sql`when ${DB_SCHEMA.comments.ytCommentId} = ${input.ytCommentId} then ${input.likeCount}`
				);
				ids.push(input.ytCommentId);
			}
			sqlChunks.push(sql`end)`);

			const finalSql: SQL = sql.join(sqlChunks, sql.raw(' '));

			const updateResult = await ResultAsync.fromPromise(
				dbClient
					.update(DB_SCHEMA.comments)
					.set({ likeCount: finalSql })
					.where(inArray(DB_SCHEMA.comments.ytCommentId, ids)),
				() => new Error('Failed to bulk update comments')
			).map(() => undefined);

			if (updateResult.isErr()) {
				return updateResult;
			}
		}

		return ok(undefined);
	}
};
