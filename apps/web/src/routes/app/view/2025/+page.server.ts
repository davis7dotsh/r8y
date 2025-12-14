import { authedRunner } from '$lib/server/runner';
import { Effect } from 'effect';

export const load = async (event) => {
	const channelId = event.url.searchParams.get('channelId') ?? '';

	if (!channelId) {
		return { channelId, channel: null, allChannels: [] };
	}

	const data = await authedRunner(event, ({ db }) =>
		Effect.gen(function* () {
			const [channel] = yield* Effect.all([db.getChannel(channelId)], {
				concurrency: 'unbounded'
			});

			return { channel };
		})
	);

	return { channelId, ...data };
};
