import { query } from '$app/server';
import z from 'zod';
import { authedRemoteRunner } from './helpers';

export const remoteSearchVideosAndSponsors = query(
	z.object({
		searchQuery: z.string(),
		channelId: z.string()
	}),
	async (args) => {
		return authedRemoteRunner(({ db }) => db.searchVideosAndSponsors(args));
	}
);
