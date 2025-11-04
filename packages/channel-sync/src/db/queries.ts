import { okAsync, ResultAsync } from 'neverthrow';
import { dbClient } from '.';
import { DB_SCHEMA, eq, inArray } from '@r8y/db';

export const DB_QUERIES = {
	getAllChannels: () => {
		return ResultAsync.fromPromise(
			dbClient.select().from(DB_SCHEMA.channels),
			() => new Error('Failed to get all channels')
		);
	},

	getAllCommentsByVideoId: (ytVideoId: string) => {
		return ResultAsync.fromPromise(
			dbClient.select().from(DB_SCHEMA.comments).where(eq(DB_SCHEMA.comments.ytVideoId, ytVideoId)),
			() => new Error('Failed to get all comments by video id')
		);
	},

	getExistingCommentsByIds: (ytCommentIds: string[]) => {
		return ResultAsync.fromPromise(
			dbClient
				.select()
				.from(DB_SCHEMA.comments)
				.where(inArray(DB_SCHEMA.comments.ytCommentId, ytCommentIds)),
			() => new Error('Failed to get comments by ids')
		).map((comments) => comments.map((comment) => comment.ytCommentId));
	},

	getChannel: (ytChannelId: string) => {
		return ResultAsync.fromPromise(
			dbClient
				.select()
				.from(DB_SCHEMA.channels)
				.where(eq(DB_SCHEMA.channels.ytChannelId, ytChannelId))
				.limit(1),
			() => new Error('Failed to get channel')
		).map((channels) => channels[0] || null);
	},

	getVideo: (ytVideoId: string) => {
		return ResultAsync.fromPromise(
			dbClient
				.select()
				.from(DB_SCHEMA.videos)
				.where(eq(DB_SCHEMA.videos.ytVideoId, ytVideoId))
				.limit(1),
			() => new Error('Failed to get video')
		).map((videos) => videos[0] || null);
	},

	getComment: (ytCommentId: string) => {
		return ResultAsync.fromPromise(
			dbClient
				.select()
				.from(DB_SCHEMA.comments)
				.where(eq(DB_SCHEMA.comments.ytCommentId, ytCommentId))
				.limit(1),
			() => new Error('Failed to get comment')
		).map((comments) => comments[0] || null);
	},

	getSponsorByKey: (sponsorKey: string) => {
		return ResultAsync.fromPromise(
			dbClient
				.select()
				.from(DB_SCHEMA.sponsors)
				.where(eq(DB_SCHEMA.sponsors.sponsorKey, sponsorKey))
				.limit(1),
			() => new Error('Failed to get sponsor by key')
		).map((sponsors) => sponsors[0] || null);
	},

	getSponsorById: (sponsorId: string) => {
		return ResultAsync.fromPromise(
			dbClient
				.select()
				.from(DB_SCHEMA.sponsors)
				.where(eq(DB_SCHEMA.sponsors.sponsorId, sponsorId))
				.limit(1),
			() => new Error('Failed to get sponsor by id')
		).map((sponsors) => sponsors[0] || null);
	},

	getSponsorForVideo: (ytVideoId: string) => {
		return ResultAsync.fromPromise(
			dbClient
				.select()
				.from(DB_SCHEMA.sponsorToVideos)
				.where(eq(DB_SCHEMA.sponsorToVideos.ytVideoId, ytVideoId))
				.limit(1),
			() => new Error('Failed to get sponsor for video')
		)
			.map((sponsors) => sponsors[0] || null)
			.andThen((sponsor) => {
				if (sponsor) {
					return ResultAsync.fromPromise(
						dbClient
							.select()
							.from(DB_SCHEMA.sponsors)
							.where(eq(DB_SCHEMA.sponsors.sponsorId, sponsor.sponsorId))
							.limit(1),
						() => new Error('Failed to get sponsor by id')
					).map((sponsors) => sponsors[0] || null);
				} else {
					return okAsync(null);
				}
			});
	},

	getSponsorAttachmentByVideoId: (ytVideoId: string) => {
		return ResultAsync.fromPromise(
			dbClient
				.select()
				.from(DB_SCHEMA.sponsorToVideos)
				.where(eq(DB_SCHEMA.sponsorToVideos.ytVideoId, ytVideoId))
				.limit(1),
			() => new Error('Failed to get sponsor attachment by video id')
		).map((attachments) => attachments[0] || null);
	}
};
