import { ResultAsync } from 'neverthrow';
import { randomBytes } from 'crypto';
import { dbClient } from '.';
import { DB_SCHEMA, eq, sql } from '@r8y/db';
import { DB_QUERIES } from './queries';

const generateId = () => randomBytes(16).toString('hex');

export const DB_MUTATIONS = {
	upsertVideo: async (data: {
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
		const existing = await DB_QUERIES.getVideo(data.ytVideoId);
		if (existing) {
			const result = await ResultAsync.fromPromise(
				dbClient
					.update(DB_SCHEMA.videos)
					.set({
						viewCount: data.viewCount,
						likeCount: data.likeCount,
						commentCount: data.commentCount
					})
					.where(eq(DB_SCHEMA.videos.ytVideoId, data.ytVideoId)),
				() => new Error('Failed to update video')
			);
			return result.match(
				() => ({ ytVideoId: data.ytVideoId, wasInserted: false }),
				(error) => {
					throw error;
				}
			);
		} else {
			const result = await ResultAsync.fromPromise(
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
			);
			return result.match(
				() => ({ ytVideoId: data.ytVideoId, wasInserted: true }),
				(error) => {
					throw error;
				}
			);
		}
	},

	upsertComment: async (data: {
		ytCommentId: string;
		ytVideoId: string;
		text: string;
		author: string;
		publishedAt: Date;
		likeCount: number;
		replyCount: number;
	}) => {
		const existing = await DB_QUERIES.getComment(data.ytCommentId);
		if (existing) {
			const result = await ResultAsync.fromPromise(
				dbClient
					.update(DB_SCHEMA.comments)
					.set({
						likeCount: data.likeCount,
						replyCount: data.replyCount
					})
					.where(eq(DB_SCHEMA.comments.ytCommentId, data.ytCommentId)),
				() => new Error('Failed to update comment')
			);
			return result.match(
				() => data.ytCommentId,
				(error) => {
					throw error;
				}
			);
		} else {
			const result = await ResultAsync.fromPromise(
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
			);
			return result.match(
				() => data.ytCommentId,
				(error) => {
					throw error;
				}
			);
		}
	},

	createSponsor: async (data: { ytChannelId: string; sponsorKey: string; name: string }) => {
		const sponsorId = generateId();
		const result = await ResultAsync.fromPromise(
			dbClient.insert(DB_SCHEMA.sponsors).values({
				sponsorId,
				ytChannelId: data.ytChannelId,
				sponsorKey: data.sponsorKey,
				name: data.name
			}),
			() => new Error('Failed to create sponsor')
		);
		return result.match(
			() => sponsorId,
			(error) => {
				throw error;
			}
		);
	},

	attachSponsorToVideo: async (data: { sponsorId: string; ytVideoId: string }) => {
		const result = await ResultAsync.fromPromise(
			dbClient.insert(DB_SCHEMA.sponsorToVideos).values({
				sponsorId: data.sponsorId,
				ytVideoId: data.ytVideoId
			}),
			() => new Error('Failed to attach sponsor to video')
		);
		return result.match(
			() => undefined,
			(error) => {
				throw error;
			}
		);
	},

	patchCommentSentiment: async (data: {
		ytCommentId: string;
		isEditingMistake: boolean;
		isSponsorMention: boolean;
		isQuestion: boolean;
		isPositiveComment: boolean;
	}) => {
		const result = await ResultAsync.fromPromise(
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
		);
		return result.match(
			() => undefined,
			(error) => {
				throw error;
			}
		);
	},

	logNotification: async (data: {
		ytVideoId: string;
		type: 'todoist_video_live' | 'discord_video_live' | 'discord_flagged_comment';
		success: boolean;
		message: string;
		commentId?: string;
	}) => {
		const notificationId = generateId();
		const result = await ResultAsync.fromPromise(
			dbClient.insert(DB_SCHEMA.notifications).values({
				notificationId,
				ytVideoId: data.ytVideoId,
				type: data.type,
				success: data.success,
				message: data.message,
				commentId: data.commentId || null
			}),
			() => new Error('Failed to log notification')
		);
		return result.match(
			() => undefined,
			(error) => {
				throw error;
			}
		);
	}
};
