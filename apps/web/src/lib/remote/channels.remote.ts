import { query } from '$app/server';
import z from 'zod';
import { authedRemoteRunner } from './helpers';

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
