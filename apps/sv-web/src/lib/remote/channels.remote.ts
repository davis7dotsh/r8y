import { form, getRequestEvent, query } from '$app/server';
import { Effect } from 'effect';
import z from 'zod';
import { remoteRunner } from './helpers';
import { AuthService } from '$lib/services/auth';
import { DbService } from '$lib/services/db';

export const remoteGetAllChannels = query(async () => {
	const result = await remoteRunner(
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const db = yield* DbService;

			const event = yield* Effect.sync(() => getRequestEvent());

			yield* auth.checkAuthAndFail(event);

			const channels = yield* db.getAllChannels();
			return yield* Effect.succeed(channels);
		})
	);
	return result;
});

export const remoteCreateChannel = form(
	z.object({
		channelName: z.string(),
		findSponsorPrompt: z.string(),
		ytChannelId: z.string()
	}),
	async (data) => {
		return await remoteRunner(
			Effect.gen(function* () {
				const auth = yield* AuthService;
				const db = yield* DbService;

				const event = yield* Effect.sync(() => getRequestEvent());
				yield* auth.checkAuthAndFail(event);

				yield* db.createChannel(data);

				return yield* Effect.succeed({
					success: true
				});
			})
		);
	}
);

export const remoteGetChannelsWithStats = query(async () => {
	return await remoteRunner(
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const db = yield* DbService;

			const event = yield* Effect.sync(() => getRequestEvent());
			yield* auth.checkAuthAndFail(event);

			const channels = yield* db.getChannelsWithStats();
			return yield* Effect.succeed(channels);
		})
	);
});

export const remoteGetLast7VideosByViews = query(z.string(), async (ytChannelId) => {
	return await remoteRunner(
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const db = yield* DbService;

			const event = yield* Effect.sync(() => getRequestEvent());
			yield* auth.checkAuthAndFail(event);

			const result = yield* db.getLast7VideosByViews(ytChannelId);

			return yield* Effect.succeed(result);
		})
	);
});

export const remoteGetChannelDetails = query(z.string(), async (ytChannelId) => {
	return await remoteRunner(
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const db = yield* DbService;

			const event = yield* Effect.sync(() => getRequestEvent());
			yield* auth.checkAuthAndFail(event);

			const channel = yield* db.getChannel(ytChannelId);

			return yield* Effect.succeed(channel);
		})
	);
});

export const remoteGetChannelVideos = query(z.string(), async (ytChannelId) => {
	return await remoteRunner(
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const db = yield* DbService;

			const event = yield* Effect.sync(() => getRequestEvent());
			yield* auth.checkAuthAndFail(event);

			const videos = yield* db.getChannelVideos(ytChannelId);
			return yield* Effect.succeed(videos);
		})
	);
});

export const remoteGetChannelNotifications = query(z.string(), async (ytChannelId) => {
	return await remoteRunner(
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const db = yield* DbService;

			const event = yield* Effect.sync(() => getRequestEvent());
			yield* auth.checkAuthAndFail(event);

			const notifications = yield* db.getChannelNotifications(ytChannelId);
			return yield* Effect.succeed(notifications);
		})
	);
});

export const remoteGetChannelSponsors = query(z.string(), async (ytChannelId) => {
	return await remoteRunner(
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const db = yield* DbService;

			const event = yield* Effect.sync(() => getRequestEvent());
			yield* auth.checkAuthAndFail(event);

			const sponsors = yield* db.getChannelSponsors(ytChannelId);
			return yield* Effect.succeed(sponsors);
		})
	);
});

export const remoteGetSponsorDetails = query(z.string(), async (sponsorId) => {
	return await remoteRunner(
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const db = yield* DbService;

			const event = yield* Effect.sync(() => getRequestEvent());
			yield* auth.checkAuthAndFail(event);

			const result = yield* db.getSponsorDetails(sponsorId);

			return yield* Effect.succeed(result);
		})
	);
});

export const remoteGetVideoDetails = query(z.string(), async (ytVideoId) => {
	return await remoteRunner(
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const db = yield* DbService;

			const event = yield* Effect.sync(() => getRequestEvent());
			yield* auth.checkAuthAndFail(event);

			const result = yield* db.getVideoDetails(ytVideoId);

			return yield* Effect.succeed(result);
		})
	);
});
