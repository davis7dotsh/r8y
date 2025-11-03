import { form, getRequestEvent, query } from '$app/server';
import { DB_MUTATIONS } from '$lib/db/mutations';
import { DB_QUERIES } from '$lib/db/queries';
import { error } from '@sveltejs/kit';
import z from 'zod';

export const remoteGetAllChannels = query(async () => {
	const event = getRequestEvent();
	const isAuthenticated = event.locals.checkAuth(event);
	if (!isAuthenticated) {
		return error(401, { message: 'Unauthorized' });
	}
	const channels = await DB_QUERIES.getAllChannels();
	if (channels.status === 'error') {
		console.error(channels.cause);
		return error(500, { message: channels.message });
	}
	return channels.data;
});

export const remoteCreateChannel = form(
	z.object({
		channelName: z.string(),
		findSponsorPrompt: z.string(),
		ytChannelId: z.string()
	}),
	async (data) => {
		const event = getRequestEvent();
		const isAuthenticated = event.locals.checkAuth(event);
		if (!isAuthenticated) {
			return error(401, { message: 'Unauthorized' });
		}
		const createChannel = await DB_MUTATIONS.createChannel(data);
		if (createChannel.status === 'error') {
			console.error(createChannel.cause);
			return error(500, { message: createChannel.message });
		}
		return {
			success: true
		};
	}
);
