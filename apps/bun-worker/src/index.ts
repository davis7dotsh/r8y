import { DB_QUERIES } from './db';
import { startJobHandler, enqueueJob } from './queue';
import { channelHandler } from './jobs/channelHandler';
import { videoHandler } from './jobs/videoHandler';

const main = async () => {
	console.log('Starting YouTube sync worker...');

	startJobHandler('channel', channelHandler).catch((error) => {
		console.error('Channel job handler error:', error);
		process.exit(1);
	});

	startJobHandler('video', videoHandler).catch((error) => {
		console.error('Video job handler error:', error);
		process.exit(1);
	});

	while (true) {
		try {
			console.log('Fetching all channels...');
			const channels = await DB_QUERIES.getAllChannels();

			console.log(`Enqueueing ${channels.length} channel jobs...`);
			for (const channel of channels) {
				await enqueueJob('channel', {
					ytChannelId: channel.ytChannelId
				});
			}

			console.log('Sleeping for 30 minutes...');
			await Bun.sleep(30 * 60 * 1000);
		} catch (error) {
			console.error('Error in main loop:', error);
			await Bun.sleep(60000);
		}
	}
};

main().catch(console.error);
