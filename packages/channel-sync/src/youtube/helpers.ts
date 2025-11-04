import { google } from 'googleapis';
import { ResultAsync, err, ok } from 'neverthrow';

const youtube = google.youtube({
	version: 'v3',
	auth: Bun.env.YT_API_KEY!
});

export const getVideosForChannel = async (args: { ytChannelId: string; maxResults?: number }) => {
	const { ytChannelId, maxResults: maxResultsArg } = args;
	const maxResults = maxResultsArg || 50;

	const videoIds: string[] = [];
	let nextPageToken: string | undefined;

	do {
		const searchResponse = await ResultAsync.fromPromise(
			youtube.search.list({
				part: ['id'],
				channelId: ytChannelId,
				type: ['video'],
				order: 'date',
				maxResults: 50,
				pageToken: nextPageToken
			}),
			(error) => new Error(`Failed to get videos for channel ${ytChannelId}: ${error}`)
		);

		if (searchResponse.isErr()) {
			return err(
				new Error(
					`Failed to get videos for channel ${ytChannelId}: ${searchResponse.error.message}`
				)
			);
		}

		const searchResponseValue = searchResponse.value.data;

		const items = searchResponseValue.items || [];
		for (const item of items) {
			if (item.id?.videoId) {
				videoIds.push(item.id.videoId);
			}
		}

		nextPageToken = searchResponseValue.nextPageToken || undefined;
	} while (nextPageToken && videoIds.length < maxResults);

	return ok(videoIds);
};

export const getVideoComments = (data: { ytVideoId: string; maxResults?: number }) => {
	return ResultAsync.fromPromise(
		youtube.commentThreads.list({
			part: ['snippet', 'replies'],
			videoId: data.ytVideoId,
			order: 'relevance',
			maxResults: data.maxResults || 20,
			textFormat: 'plainText'
		}),
		(error) => new Error(`Failed to get comments for video ${data.ytVideoId}: ${error}`)
	).map((response) =>
		(response.data.items ?? []).map((item) => ({
			ytCommentId: item.id!,
			text: item.snippet?.topLevelComment?.snippet?.textDisplay || '',
			author: item.snippet?.topLevelComment?.snippet?.authorDisplayName || '',
			publishedAt: new Date(item.snippet?.topLevelComment?.snippet?.publishedAt || '').getTime(),
			likeCount: item.snippet?.topLevelComment?.snippet?.likeCount || 0,
			replyCount: item.snippet?.totalReplyCount || 0
		}))
	);
};

export const getVideoDetails = (data: { ytVideoId: string }) => {
	return ResultAsync.fromPromise(
		youtube.videos.list({
			part: ['snippet', 'statistics', 'contentDetails'],
			id: [data.ytVideoId]
		}),
		(error) => new Error(`Failed to get details for video ${data.ytVideoId}: ${error}`)
	).andThen((response) => {
		const item = response.data.items?.[0];
		if (!item || !item.id || !item.snippet || !item.snippet.channelId) {
			return err(new Error(`Video ${data.ytVideoId} not found`));
		}

		return ok({
			channelId: item.snippet.channelId,
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
	});
};
