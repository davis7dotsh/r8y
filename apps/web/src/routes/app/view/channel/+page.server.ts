import { authedRunner } from '$lib/server/runner';
import { Effect } from 'effect';

export const load = async (event) => {
	const channelId = event.url.searchParams.get('channelId') ?? '';

	const data = await authedRunner(event, ({ db }) =>
		Effect.gen(function* () {
			const [channel, allChannels, videos, notifications, last7Videos, sponsors] =
				yield* Effect.all(
					[
						db.getChannel(channelId),
						db.getAllChannels(),
						db.getChannelVideos({ ytChannelId: channelId, limit: 20 }),
						db.getChannelNotifications(channelId),
						db.getLast7VideosByViews(channelId),
						db.getChannelSponsors(channelId)
					],
					{ concurrency: 'unbounded' }
				);

			return { channel, allChannels, videos, notifications, last7Videos, sponsors };
		})
	);

	return { channelId, ...data };
};
