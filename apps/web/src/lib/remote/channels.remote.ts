import { form, query } from '$app/server';
import { Effect, Schema } from 'effect';
import z from 'zod';
import { authedRemoteRunner } from './helpers';

const createChannelSchema = Schema.Struct({
	channelName: Schema.String.pipe(Schema.nonEmptyString()),
	ytChannelId: Schema.String.pipe(Schema.nonEmptyString()),
	findSponsorPrompt: Schema.String
}).pipe(Schema.standardSchemaV1);

export const remoteCreateChannel = form(createChannelSchema, async (data) => {
	await authedRemoteRunner(({ db }) =>
		Effect.gen(function* () {
			yield* db.createChannel(data);
		})
	);
	return { success: true, ytChannelId: data.ytChannelId };
});

export const remoteSearchVideosAndSponsors = query(
	z.object({
		searchQuery: z.string(),
		channelId: z.string()
	}),
	async (args) => {
		const { results } = await authedRemoteRunner(({ db }) => db.searchVideosAndSponsors(args));

		return results;
	}
);

export const remoteGetAllChannels = query(async () => {
	const results = await authedRemoteRunner(({ db }) => db.getChannelsWithStats());
	return results;
});

export const remoteGetChannel = query(
	Schema.String.pipe(Schema.standardSchemaV1),
	async (channelId) => {
		return await authedRemoteRunner(({ db }) => db.getChannel(channelId));
	}
);

export const remoteGet2025Videos = query(
	Schema.String.pipe(Schema.standardSchemaV1),
	async (channelId) => {
		return await authedRemoteRunner(({ db }) => db.getChannelVideos2025(channelId));
	}
);

export const remoteGet2025Sponsors = query(
	Schema.String.pipe(Schema.standardSchemaV1),
	async (channelId) => {
		return await authedRemoteRunner(({ db }) => db.getChannelSponsors2025(channelId));
	}
);

export const remoteGetVideoDetails = query(
	Schema.String.pipe(Schema.standardSchemaV1),
	async (videoId) => {
		return await authedRemoteRunner(({ db }) => db.getVideoDetails(videoId));
	}
);

export const remoteGetSponsorDetails = query(
	Schema.String.pipe(Schema.standardSchemaV1),
	async (sponsorId) => {
		return await authedRemoteRunner(({ db }) => db.getSponsorDetails(sponsorId));
	}
);

export const remoteGetChannelVideos = query(
	Schema.String.pipe(Schema.standardSchemaV1),
	async (channelId) => {
		return await authedRemoteRunner(({ db }) => db.getChannelVideos({ ytChannelId: channelId, limit: 20 }));
	}
);

export const remoteGetChannelNotifications = query(
	Schema.String.pipe(Schema.standardSchemaV1),
	async (channelId) => {
		return await authedRemoteRunner(({ db }) => db.getChannelNotifications(channelId));
	}
);

export const remoteGetLast7Videos = query(
	Schema.String.pipe(Schema.standardSchemaV1),
	async (channelId) => {
		return await authedRemoteRunner(({ db }) => db.getLast7VideosByViews(channelId));
	}
);

export const remoteGetChannelSponsors = query(
	Schema.String.pipe(Schema.standardSchemaV1),
	async (channelId) => {
		return await authedRemoteRunner(({ db }) => db.getChannelSponsors(channelId));
	}
);
