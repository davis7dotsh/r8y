import { DB_QUERIES, DB_MUTATIONS } from '../db';
import { parseYouTubeRSS } from '../youtube/helpers';
import { enqueueJob } from '../queue';

export const channelHandler = async (payload: unknown) => {
	const { ytChannelId } = payload as { ytChannelId: string };

	const channel = await DB_QUERIES.getChannel(ytChannelId);
	if (!channel) {
		throw new Error(`Channel ${ytChannelId} not found`);
	}

	const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${ytChannelId}`;

	const response = await fetch(rssUrl);
	if (!response.ok) {
		throw new Error(`Failed to fetch RSS for channel ${ytChannelId}`);
	}

	const xml = await response.text();
	const entries = parseYouTubeRSS(xml);

	const videoResults = await Promise.all(
		entries.map((entry) =>
			DB_MUTATIONS.upsertVideo({
				ytVideoId: entry.videoId,
				ytChannelId: channel.ytChannelId,
				title: entry.title,
				description: entry.description,
				thumbnailUrl: entry.thumbnailUrl,
				publishedAt: new Date(entry.publishedAt),
				viewCount: entry.viewCount,
				likeCount: entry.likeCount,
				commentCount: entry.commentCount
			})
		)
	);

	for (const result of videoResults) {
		await enqueueJob('video', {
			ytVideoId: result.ytVideoId,
			wasInserted: result.wasInserted
		});
	}
};

