import { google } from 'googleapis';

const youtube = google.youtube({
	version: 'v3',
	auth: Bun.env.YT_API_KEY!
});

function parseISO8601Duration(duration: string): number {
	const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
	if (!match) return 0;
	const hours = parseInt(match[1] || '0', 10);
	const minutes = parseInt(match[2] || '0', 10);
	const seconds = parseInt(match[3] || '0', 10);
	return hours * 3600 + minutes * 60 + seconds;
}

export function parseYouTubeRSS(xml: string) {
	const entries: Array<{
		videoId: string;
		title: string;
		description: string;
		thumbnailUrl: string;
		publishedAt: number;
		viewCount: number;
		likeCount: number;
		commentCount: number;
	}> = [];

	const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
	let match;

	while ((match = entryRegex.exec(xml)) !== null) {
		const entryXml = match[1];

		if (!entryXml) continue;

		const videoIdMatch = entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
		const titleMatch = entryXml.match(/<title>([^<]+)<\/title>/);
		const descriptionMatch = entryXml.match(/<media:description>([^<]+)<\/media:description>/);
		const thumbnailMatch = entryXml.match(/<media:thumbnail[^>]+url="([^"]+)"/);
		const publishedMatch = entryXml.match(/<published>([^<]+)<\/published>/);
		const viewCountMatch = entryXml.match(/<media:statistics[^>]+views="([^"]+)"/);
		const likeCountMatch = entryXml.match(/<media:starRating[^>]+count="([^"]+)"/);

		if (!videoIdMatch || !titleMatch || !publishedMatch) continue;

		if (videoIdMatch && titleMatch && publishedMatch) {
			entries.push({
				videoId: videoIdMatch[1]!,
				title: titleMatch[1]!,
				description: descriptionMatch?.[1] || '',
				thumbnailUrl: thumbnailMatch?.[1] || '',
				publishedAt: new Date(publishedMatch[1]!).getTime(),
				viewCount: parseInt(viewCountMatch?.[1] || '0', 10),
				likeCount: parseInt(likeCountMatch?.[1] || '0', 10),
				commentCount: 0
			});
		}
	}

	return entries;
}

export const getChannelVideos = async (data: { ytChannelId: string }) => {
	try {
		const videoIds: string[] = [];
		let nextPageToken: string | undefined;

		do {
			const searchResponse = await youtube.search.list({
				part: ['id'],
				channelId: data.ytChannelId,
				type: ['video'],
				order: 'date',
				maxResults: 50,
				pageToken: nextPageToken
			});

			const items = searchResponse.data.items || [];
			for (const item of items) {
				if (item.id?.videoId) {
					videoIds.push(item.id.videoId);
				}
			}

			nextPageToken = searchResponse.data.nextPageToken || undefined;

			if (videoIds.length >= 150) {
				break;
			}
		} while (nextPageToken && videoIds.length < 150);

		const videoIdsToFetch = videoIds.slice(0, 150);
		const videos: Array<{
			videoId: string;
			title: string;
			description: string;
			thumbnailUrl: string;
			publishedAt: number;
			viewCount: number;
			likeCount: number;
			commentCount: number;
		}> = [];

		for (let i = 0; i < videoIdsToFetch.length; i += 50) {
			const batch = videoIdsToFetch.slice(i, i + 50);
			const videosResponse = await youtube.videos.list({
				part: ['snippet', 'statistics', 'contentDetails'],
				id: batch
			});

			const items = videosResponse.data.items || [];
			for (const item of items) {
				if (!item.id || !item.snippet) continue;

				const liveBroadcastContent = item.snippet.liveBroadcastContent;
				if (liveBroadcastContent && liveBroadcastContent !== 'none') {
					continue;
				}

				const duration = item.contentDetails?.duration;
				if (duration) {
					const durationSeconds = parseISO8601Duration(duration);
					if (durationSeconds < 60) {
						continue;
					}
				}

				videos.push({
					videoId: item.id,
					title: item.snippet.title || '',
					description: item.snippet.description || '',
					thumbnailUrl:
						item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
					publishedAt: item.snippet.publishedAt ? new Date(item.snippet.publishedAt).getTime() : 0,
					viewCount: parseInt(item.statistics?.viewCount || '0', 10),
					likeCount: parseInt(item.statistics?.likeCount || '0', 10),
					commentCount: parseInt(item.statistics?.commentCount || '0', 10)
				});
			}
		}

		return videos;
	} catch (error) {
		console.error('Failed to get channel videos:', error);
		throw new Error(`Failed to get videos for channel ${data.ytChannelId}`);
	}
};

export const getVideoComments = async (data: { ytVideoId: string; maxResults?: number }) => {
	try {
		const response = await youtube.commentThreads.list({
			part: ['snippet', 'replies'],
			videoId: data.ytVideoId,
			order: 'relevance',
			maxResults: data.maxResults || 20,
			textFormat: 'plainText'
		});

		return (response.data.items ?? []).map((item) => ({
			ytCommentId: item.id!,
			text: item.snippet?.topLevelComment?.snippet?.textDisplay || '',
			author: item.snippet?.topLevelComment?.snippet?.authorDisplayName || '',
			publishedAt: new Date(item.snippet?.topLevelComment?.snippet?.publishedAt || '').getTime(),
			likeCount: item.snippet?.topLevelComment?.snippet?.likeCount || 0,
			replyCount: item.snippet?.totalReplyCount || 0
		}));
	} catch (error) {
		console.error('Failed to get video comments:', error);
		throw new Error(`Failed to get comments for video ${data.ytVideoId}`);
	}
};
