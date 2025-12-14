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
