import { authedRunner } from '$lib/server/runner';
import { Effect } from 'effect';

export const load = async (event) => {
	const channelId = event.url.searchParams.get('channelId') ?? '';

	if (!channelId) {
		return { channelId, channel: null, data2025: null, allChannels: [] };
	}

	const data = await authedRunner(event, ({ db }) =>
		Effect.gen(function* () {
			const [channel, data2025, allChannels] = yield* Effect.all(
				[
					db.getChannel(channelId),
					Effect.all(
						[db.getChannelVideos2025(channelId), db.getChannelSponsors2025(channelId)],
						{ concurrency: 'unbounded' }
					).pipe(Effect.map(([videos, sponsors]) => ({ videos, sponsors }))),
					db.getAllChannels()
				],
				{ concurrency: 'unbounded' }
			);

			return { channel, data2025, allChannels };
		})
	);

	return { channelId, ...data };
};
