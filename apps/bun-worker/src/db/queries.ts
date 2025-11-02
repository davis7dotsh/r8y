import { ResultAsync } from 'neverthrow';
import { dbClient } from '.';
import { DB_SCHEMA, eq } from '@r8y/db';

export const DB_QUERIES = {
	getAllChannels: async () => {
		const result = await ResultAsync.fromPromise(
			dbClient.select().from(DB_SCHEMA.channels),
			() => new Error('Failed to get all channels')
		);
		return result.match(
			(channels) => channels,
			(error) => {
				throw error;
			}
		);
	},

	getChannel: async (ytChannelId: string) => {
		const result = await ResultAsync.fromPromise(
			dbClient
				.select()
				.from(DB_SCHEMA.channels)
				.where(eq(DB_SCHEMA.channels.ytChannelId, ytChannelId))
				.limit(1),
			() => new Error('Failed to get channel')
		);
		return result.match(
			(channels) => channels[0] || null,
			(error) => {
				throw error;
			}
		);
	},

	getVideo: async (ytVideoId: string) => {
		const result = await ResultAsync.fromPromise(
			dbClient
				.select()
				.from(DB_SCHEMA.videos)
				.where(eq(DB_SCHEMA.videos.ytVideoId, ytVideoId))
				.limit(1),
			() => new Error('Failed to get video')
		);
		return result.match(
			(videos) => videos[0] || null,
			(error) => {
				throw error;
			}
		);
	},

	getComment: async (ytCommentId: string) => {
		const result = await ResultAsync.fromPromise(
			dbClient
				.select()
				.from(DB_SCHEMA.comments)
				.where(eq(DB_SCHEMA.comments.ytCommentId, ytCommentId))
				.limit(1),
			() => new Error('Failed to get comment')
		);
		return result.match(
			(comments) => comments[0] || null,
			(error) => {
				throw error;
			}
		);
	},

	getSponsorByKey: async (sponsorKey: string) => {
		const result = await ResultAsync.fromPromise(
			dbClient
				.select()
				.from(DB_SCHEMA.sponsors)
				.where(eq(DB_SCHEMA.sponsors.sponsorKey, sponsorKey))
				.limit(1),
			() => new Error('Failed to get sponsor by key')
		);
		return result.match(
			(sponsors) => sponsors[0] || null,
			(error) => {
				throw error;
			}
		);
	},

	getSponsorById: async (sponsorId: string) => {
		const result = await ResultAsync.fromPromise(
			dbClient
				.select()
				.from(DB_SCHEMA.sponsors)
				.where(eq(DB_SCHEMA.sponsors.sponsorId, sponsorId))
				.limit(1),
			() => new Error('Failed to get sponsor by id')
		);
		return result.match(
			(sponsors) => sponsors[0] || null,
			(error) => {
				throw error;
			}
		);
	},

	getSponsorAttachmentByVideoId: async (ytVideoId: string) => {
		const result = await ResultAsync.fromPromise(
			dbClient
				.select()
				.from(DB_SCHEMA.sponsorToVideos)
				.where(eq(DB_SCHEMA.sponsorToVideos.ytVideoId, ytVideoId))
				.limit(1),
			() => new Error('Failed to get sponsor attachment by video id')
		);
		return result.match(
			(attachments) => attachments[0] || null,
			(error) => {
				throw error;
			}
		);
	}
};
