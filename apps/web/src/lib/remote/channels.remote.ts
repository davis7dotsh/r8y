import { form, query } from '$app/server';
import { Effect } from 'effect';
import z from 'zod';
import { authedRemoteRunner } from './helpers';

export const remoteGetAllChannels = query(async () => {
	return authedRemoteRunner(({ db }) => db.getAllChannels());
});

export const remoteCreateChannel = form(
	z.object({
		channelName: z.string(),
		findSponsorPrompt: z.string(),
		ytChannelId: z.string()
	}),
	async (data) => {
		return authedRemoteRunner(({ db }) =>
			Effect.gen(function* () {
				yield* db.createChannel(data);
				return { success: true };
			})
		);
	}
);

export const remoteGetChannelsWithStats = query(async () => {
	return authedRemoteRunner(({ db }) => db.getChannelsWithStats());
});

export const remoteGetLast7VideosByViews = query(z.string(), async (ytChannelId) => {
	return authedRemoteRunner(({ db }) => db.getLast7VideosByViews(ytChannelId));
});

export const remoteGetChannelDetails = query(z.string(), async (ytChannelId) => {
	return authedRemoteRunner(({ db }) => db.getChannel(ytChannelId));
});

export const remoteGetChannelVideos = query(z.string(), async (ytChannelId) => {
	return authedRemoteRunner(({ db }) =>
		db.getChannelVideos({
			ytChannelId,
			limit: 20
		})
	);
});

export const remoteGetChannelNotifications = query(z.string(), async (ytChannelId) => {
	return authedRemoteRunner(({ db }) => db.getChannelNotifications(ytChannelId));
});

export const remoteGetChannelSponsors = query(z.string(), async (ytChannelId) => {
	return authedRemoteRunner(({ db }) => db.getChannelSponsors(ytChannelId));
});

export const remoteGetSponsorDetails = query(z.string(), async (sponsorId) => {
	return authedRemoteRunner(({ db }) => db.getSponsorDetails(sponsorId));
});

export const remoteSearchVideosAndSponsors = query(
	z.object({
		searchQuery: z.string(),
		channelId: z.string()
	}),
	async (args) => {
		return authedRemoteRunner(({ db }) => db.searchVideosAndSponsors(args));
	}
);

export const remoteGetVideoDetails = query(z.string(), async (ytVideoId) => {
	return authedRemoteRunner(({ db }) => db.getVideoDetails(ytVideoId));
});
