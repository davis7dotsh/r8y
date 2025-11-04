import { getRecentVideosForChannel, syncVideo } from '@r8y/channel-sync';
import { DB_QUERIES } from './db';
import { errAsync } from 'neverthrow';

const main = async () => {
	const channels = await DB_QUERIES.getAllChannels();
	if (channels.isErr()) {
		console.error('LIVE CRAWLER CRASHED: Failed to get all channels', channels.error);
		return;
	}

	const channelsValue = channels.value;

	const allRecentVideosResults = await Promise.allSettled(
		channelsValue.map(async (channel) =>
			getRecentVideosForChannel({ ytChannelId: channel.ytChannelId })
		)
	);

	let successCount = 0;
	let errorCount = 0;

	for (const result of allRecentVideosResults) {
		if (result.status === 'fulfilled' && result.value.isOk()) {
			const recentVideos = result.value.value;
			await Promise.allSettled(
				recentVideos.map(async (video) => {
					const syncVideoResult = await syncVideo({
						ytVideoId: video.videoId
					});
					if (syncVideoResult.isOk()) {
						successCount++;
						console.log(`Synced video ${video.videoId} - ${video.title}`);
					} else {
						errorCount++;
						console.error('LIVE CRAWLER CRASHED: Failed to sync video', syncVideoResult.error);
					}
				})
			);
		}
	}

	console.log(`LIVE CRAWLER COMPLETED: ${successCount} videos synced, ${errorCount} videos failed`);
};

main();
