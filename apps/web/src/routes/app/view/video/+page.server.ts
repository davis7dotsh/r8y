import { authedRunner } from '$lib/server/runner';
import { Effect } from 'effect';

export const load = async (event) => {
	const videoId = event.url.searchParams.get('videoId') ?? '';
	const channelId = event.url.searchParams.get('channelId') ?? '';

	const data = await authedRunner(event, ({ db }) =>
		Effect.gen(function* () {
			const [videoData, channel, allChannels] = yield* Effect.all(
				[db.getVideoDetails(videoId), db.getChannel(channelId), db.getAllChannels()],
				{ concurrency: 'unbounded' }
			);

			return { videoData, channel, allChannels };
		})
	);

	return { videoId, channelId, ...data };
};
