import { authedRunner } from '$lib/server/runner';
import { Effect } from 'effect';

export const load = async (event) => {
	const sponsorId = event.url.searchParams.get('sponsorId') ?? '';
	const channelId = event.url.searchParams.get('channelId') ?? '';

	const data = await authedRunner(event, ({ db }) =>
		Effect.gen(function* () {
			const [sponsor, channel, allChannels] = yield* Effect.all(
				[db.getSponsorDetails(sponsorId), db.getChannel(channelId), db.getAllChannels()],
				{ concurrency: 'unbounded' }
			);

			return { sponsor, channel, allChannels };
		})
	);

	return { sponsorId, channelId, ...data };
};
