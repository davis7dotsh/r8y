import { google } from 'googleapis';
import { Effect } from 'effect';
import { TaggedError } from 'effect/Data';
import { DbService } from '../db';

class YoutubeError extends TaggedError('YoutubeError') {
	constructor(message: string, options?: { cause?: unknown }) {
		super();
		this.message = message;
		this.cause = options?.cause;
	}
}

const youtubeService = Effect.gen(function* () {
	const youtubeApiKey = yield* Effect.sync(() => Bun.env.YT_API_KEY);

	if (!youtubeApiKey) {
		return yield* Effect.die('YT_API_KEY is not set');
	}

	const youtube = google.youtube({
		version: 'v3',
		auth: youtubeApiKey
	});

	const db = yield* DbService;

	const parseYouTubeRSS = (xml: string) => {
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
	};

	return {
		getRecentVideosForChannel: (args: { ytChannelId: string }) =>
			Effect.gen(function* () {
				const channel = yield* db.getChannel(args.ytChannelId);
				if (!channel) {
					return yield* Effect.fail(
						new YoutubeError(`Channel ${args.ytChannelId} not found`, {
							cause: new Error('Channel not found')
						})
					);
				}

				const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${args.ytChannelId}`;

				const response = yield* Effect.tryPromise({
					try: () => fetch(rssUrl),
					catch: (err) => new YoutubeError(`Failed to fetch RSS for channel`, { cause: err })
				});

				if (!response.ok) {
					return yield* Effect.fail(
						new YoutubeError(`Failed to fetch RSS for channel ${args.ytChannelId}`)
					);
				}

				const xml = yield* Effect.tryPromise({
					try: () => response.text(),
					catch: (err) => new YoutubeError(`Failed to read RSS text`, { cause: err })
				});

				return parseYouTubeRSS(xml);
			}),

		getVideosForChannel: (args: { ytChannelId: string; maxResults?: number }) =>
			Effect.gen(function* () {
				const playlists = yield* Effect.tryPromise({
					try: () =>
						youtube.channels.list({
							part: ['contentDetails'],
							id: [args.ytChannelId]
						}),
					catch: (err) =>
						new YoutubeError(`Failed to get playlists for channel ${args.ytChannelId}`, {
							cause: err
						})
				});

				const uploadsPlaylistId =
					playlists.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

				if (!uploadsPlaylistId) {
					return yield* Effect.fail(
						new YoutubeError(`Could not find uploads playlist for channel ${args.ytChannelId}`)
					);
				}

				yield* Effect.log(`Uploads playlist ID: ${uploadsPlaylistId}`);

				let videoIds: string[] = [];
				let nextPageToken: string | undefined;
				const maxSearchResults = args.maxResults
					? args.maxResults < 50
						? args.maxResults
						: 50
					: 50;
				const maxResults = args.maxResults ? args.maxResults : 50;

				do {
					const playlistResponse = yield* Effect.tryPromise({
						try: () =>
							youtube.playlistItems.list({
								part: ['contentDetails'],
								playlistId: uploadsPlaylistId,
								maxResults: maxSearchResults,
								...(nextPageToken !== undefined && { pageToken: nextPageToken })
							}),
						catch: (err) =>
							new YoutubeError(`Failed to get playlist items for playlist ${uploadsPlaylistId}`, {
								cause: err
							})
					});

					const items = playlistResponse.data.items || [];
					for (const item of items) {
						if (item.contentDetails?.videoId) {
							videoIds.push(item.contentDetails.videoId);
						}
					}
					nextPageToken = playlistResponse.data.nextPageToken || undefined;
				} while (nextPageToken && videoIds.length < maxResults);

				return videoIds;
			}),

		getVideoComments: (data: { ytVideoId: string; maxResults?: number }) =>
			Effect.gen(function* () {
				const response = yield* Effect.tryPromise({
					try: () =>
						youtube.commentThreads.list({
							part: ['snippet', 'replies'],
							videoId: data.ytVideoId,
							order: 'relevance',
							maxResults: data.maxResults || 20,
							textFormat: 'plainText'
						}),
					catch: (err) =>
						new YoutubeError(`Failed to get comments for video ${data.ytVideoId}`, { cause: err })
				});

				return (response.data.items ?? []).map((item) => ({
					ytCommentId: item.id!,
					text: item.snippet?.topLevelComment?.snippet?.textDisplay || '',
					author: item.snippet?.topLevelComment?.snippet?.authorDisplayName || '',
					publishedAt: new Date(
						item.snippet?.topLevelComment?.snippet?.publishedAt || ''
					).getTime(),
					likeCount: item.snippet?.topLevelComment?.snippet?.likeCount || 0,
					replyCount: item.snippet?.totalReplyCount || 0
				}));
			}),

		getVideoDetails: (data: { ytVideoId: string }) =>
			Effect.gen(function* () {
				const response = yield* Effect.tryPromise({
					try: () =>
						youtube.videos.list({
							part: ['snippet', 'statistics', 'contentDetails'],
							id: [data.ytVideoId]
						}),
					catch: (err) =>
						new YoutubeError(`Failed to get details for video ${data.ytVideoId}`, { cause: err })
				});

				const item = response.data.items?.[0];
				if (!item || !item.id || !item.snippet || !item.snippet.channelId) {
					return yield* Effect.fail(new YoutubeError(`Video ${data.ytVideoId} not found`));
				}

				return {
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
				};
			})
	};
});

export class YoutubeService extends Effect.Service<YoutubeService>()('YoutubeService', {
	effect: youtubeService
}) {}
