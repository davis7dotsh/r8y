import { ResultAsync } from 'neverthrow';
import { dbClient } from '.';
import { DB_SCHEMA, eq, desc, and, gte, sql, count, sum, max } from '@r8y/db';

export const DB_QUERIES = {
	getAllChannels: async () => {
		const channelsResult = await ResultAsync.fromPromise(
			dbClient.select().from(DB_SCHEMA.channels),
			(error) => {
				console.error(`DB QUERIES.getAllChannels: ${error}`);
				return new Error('Failed to get all channels');
			}
		);

		return channelsResult.match(
			(channels) => {
				return {
					status: 'success' as const,
					data: channels
				};
			},
			(error) => {
				return {
					status: 'error' as const,
					message: error.message,
					cause: error
				};
			}
		);
	},

	getChannelsWithStats: async () => {
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const channelsResult = await ResultAsync.fromPromise(
			dbClient.select().from(DB_SCHEMA.channels),
			(error) => {
				console.error(`DB QUERIES.getChannelsWithStats: ${error}`);
				return new Error('Failed to get channels');
			}
		);

		if (channelsResult.isErr()) {
			return {
				status: 'error' as const,
				message: channelsResult.error.message,
				cause: channelsResult.error
			};
		}

		const channels = channelsResult.value;
		const results = await Promise.all(
			channels.map(async (channel) => {
				const statsResult = await ResultAsync.fromPromise(
					dbClient
						.select({
							videoCount: count(DB_SCHEMA.videos.ytVideoId),
							totalViews: sum(DB_SCHEMA.videos.viewCount)
						})
						.from(DB_SCHEMA.videos)
						.where(
							and(
								eq(DB_SCHEMA.videos.ytChannelId, channel.ytChannelId),
								gte(DB_SCHEMA.videos.publishedAt, thirtyDaysAgo)
							)
						),
					(error) => {
						console.error(`DB QUERIES.getChannelsWithStats (stats): ${error}`);
						return new Error('Failed to get stats');
					}
				);

				const latestVideoResult = await ResultAsync.fromPromise(
					dbClient
						.select({
							ytVideoId: DB_SCHEMA.videos.ytVideoId,
							title: DB_SCHEMA.videos.title,
							viewCount: DB_SCHEMA.videos.viewCount
						})
						.from(DB_SCHEMA.videos)
						.where(
							and(
								eq(DB_SCHEMA.videos.ytChannelId, channel.ytChannelId),
								gte(DB_SCHEMA.videos.publishedAt, thirtyDaysAgo)
							)
						)
						.orderBy(desc(DB_SCHEMA.videos.publishedAt))
						.limit(1),
					(error) => {
						console.error(`DB QUERIES.getChannelsWithStats (latestVideo): ${error}`);
						return new Error('Failed to get latest video');
					}
				);

				const stats = statsResult.isOk() ? statsResult.value[0] : { videoCount: 0, totalViews: 0 };
				const latestVideo = latestVideoResult.isOk() ? latestVideoResult.value[0] || null : null;

				return {
					...channel,
					videoCount: Number(stats.videoCount) || 0,
					totalViews: Number(stats.totalViews) || 0,
					latestVideo
				};
			})
		);

		return {
			status: 'success' as const,
			data: results
		};
	},

	getLast7VideosByViews: async (ytChannelId: string) => {
		const videosResult = await ResultAsync.fromPromise(
			dbClient
				.select({
					video: DB_SCHEMA.videos,
					sponsor: DB_SCHEMA.sponsors
				})
				.from(DB_SCHEMA.videos)
				.leftJoin(
					DB_SCHEMA.sponsorToVideos,
					eq(DB_SCHEMA.sponsorToVideos.ytVideoId, DB_SCHEMA.videos.ytVideoId)
				)
				.leftJoin(
					DB_SCHEMA.sponsors,
					eq(DB_SCHEMA.sponsors.sponsorId, DB_SCHEMA.sponsorToVideos.sponsorId)
				)
				.where(and(eq(DB_SCHEMA.videos.ytChannelId, ytChannelId)))
				.orderBy(desc(DB_SCHEMA.videos.publishedAt))
				.limit(7),
			(error) => {
				console.error(`DB QUERIES.getLast7VideosByViews: ${error}`);
				return new Error('Failed to get last 7 videos');
			}
		);

		const channelResult = await ResultAsync.fromPromise(
			dbClient
				.select()
				.from(DB_SCHEMA.channels)
				.where(eq(DB_SCHEMA.channels.ytChannelId, ytChannelId))
				.limit(1),
			(error) => {
				console.error(`DB QUERIES.getLast7VideosByViews (channel): ${error}`);
				return new Error('Failed to get channel');
			}
		);

		const videosMatch = await videosResult;
		const channelMatch = await channelResult;

		if (videosMatch.isErr()) {
			return {
				status: 'error' as const,
				message: videosMatch.error.message,
				cause: videosMatch.error
			};
		}

		if (channelMatch.isErr()) {
			return {
				status: 'error' as const,
				message: channelMatch.error.message,
				cause: channelMatch.error
			};
		}

		const channel = channelMatch.value[0];
		if (!channel) {
			return {
				status: 'error' as const,
				message: 'Channel not found',
				cause: null
			};
		}

		const videos = videosMatch.value.map((v) => ({
			...v.video,
			sponsor: v.sponsor || null
		}));

		const totalViews = videos.reduce((sum: number, v) => sum + v.viewCount, 0);

		return {
			status: 'success' as const,
			data: {
				channel,
				videos,
				totalViews
			}
		};
	},

	getChannelDetails: async (ytChannelId: string) => {
		const result = await ResultAsync.fromPromise(
			dbClient
				.select()
				.from(DB_SCHEMA.channels)
				.where(eq(DB_SCHEMA.channels.ytChannelId, ytChannelId))
				.limit(1),
			(error) => {
				console.error(`DB QUERIES.getChannelDetails: ${error}`);
				return new Error('Failed to get channel details');
			}
		);

		return result.match(
			(channels) => {
				return {
					status: 'success' as const,
					data: channels[0] || null
				};
			},
			(error) => {
				return {
					status: 'error' as const,
					message: error.message,
					cause: error
				};
			}
		);
	},

	getChannelVideos: async (ytChannelId: string) => {
		const result = await ResultAsync.fromPromise(
			dbClient
				.select({
					video: DB_SCHEMA.videos,
					sponsor: DB_SCHEMA.sponsors
				})
				.from(DB_SCHEMA.videos)
				.leftJoin(
					DB_SCHEMA.sponsorToVideos,
					eq(DB_SCHEMA.sponsorToVideos.ytVideoId, DB_SCHEMA.videos.ytVideoId)
				)
				.leftJoin(
					DB_SCHEMA.sponsors,
					eq(DB_SCHEMA.sponsors.sponsorId, DB_SCHEMA.sponsorToVideos.sponsorId)
				)
				.where(eq(DB_SCHEMA.videos.ytChannelId, ytChannelId))
				.orderBy(desc(DB_SCHEMA.videos.publishedAt))
				.limit(50),
			(error) => {
				console.error(`DB QUERIES.getChannelVideos: ${error}`);
				return new Error('Failed to get channel videos');
			}
		);

		return result.match(
			(videos) => {
				return {
					status: 'success' as const,
					data: videos.map((v) => ({
						...v.video,
						sponsor: v.sponsor || null
					}))
				};
			},
			(error) => {
				return {
					status: 'error' as const,
					message: error.message,
					cause: error
				};
			}
		);
	},

	getChannelNotifications: async (ytChannelId: string) => {
		const result = await ResultAsync.fromPromise(
			dbClient
				.select({
					notification: DB_SCHEMA.notifications,
					videoTitle: DB_SCHEMA.videos.title
				})
				.from(DB_SCHEMA.notifications)
				.innerJoin(
					DB_SCHEMA.videos,
					eq(DB_SCHEMA.videos.ytVideoId, DB_SCHEMA.notifications.ytVideoId)
				)
				.where(eq(DB_SCHEMA.videos.ytChannelId, ytChannelId))
				.orderBy(desc(DB_SCHEMA.notifications.createdAt))
				.limit(50),
			(error) => {
				console.error(`DB QUERIES.getChannelNotifications: ${error}`);
				return new Error('Failed to get channel notifications');
			}
		);

		return result.match(
			(notifications) => {
				return {
					status: 'success' as const,
					data: notifications.map((n) => ({
						...n.notification,
						videoTitle: n.videoTitle
					}))
				};
			},
			(error) => {
				return {
					status: 'error' as const,
					message: error.message,
					cause: error
				};
			}
		);
	},

	getChannelSponsors: async (ytChannelId: string) => {
		const result = await ResultAsync.fromPromise(
			dbClient
				.select({
					sponsor: DB_SCHEMA.sponsors,
					totalViews: sum(DB_SCHEMA.videos.viewCount),
					totalVideos: count(DB_SCHEMA.videos.ytVideoId),
					lastVideoPublishedAt: max(DB_SCHEMA.videos.publishedAt)
				})
				.from(DB_SCHEMA.sponsors)
				.leftJoin(
					DB_SCHEMA.sponsorToVideos,
					eq(DB_SCHEMA.sponsorToVideos.sponsorId, DB_SCHEMA.sponsors.sponsorId)
				)
				.leftJoin(
					DB_SCHEMA.videos,
					eq(DB_SCHEMA.videos.ytVideoId, DB_SCHEMA.sponsorToVideos.ytVideoId)
				)
				.where(eq(DB_SCHEMA.sponsors.ytChannelId, ytChannelId))
				.groupBy(DB_SCHEMA.sponsors.sponsorId),
			(error) => {
				console.error(`DB QUERIES.getChannelSponsors: ${error}`);
				return new Error('Failed to get channel sponsors');
			}
		);

		return result.match(
			(sponsors) => {
				return {
					status: 'success' as const,
					data: sponsors.map((s) => {
						const lastPublishedAt = s.lastVideoPublishedAt
							? new Date(s.lastVideoPublishedAt)
							: null;
						const daysAgo = lastPublishedAt
							? Math.floor((Date.now() - lastPublishedAt.getTime()) / (1000 * 60 * 60 * 24))
							: null;

						return {
							...s.sponsor,
							totalViews: Number(s.totalViews) || 0,
							totalVideos: Number(s.totalVideos) || 0,
							lastVideoPublishedAt: lastPublishedAt?.getTime() || null,
							lastVideoPublishedDaysAgo: daysAgo
						};
					})
				};
			},
			(error) => {
				return {
					status: 'error' as const,
					message: error.message,
					cause: error
				};
			}
		);
	},

	getSponsorDetails: async (sponsorId: string) => {
		const sponsorResult = await ResultAsync.fromPromise(
			dbClient
				.select()
				.from(DB_SCHEMA.sponsors)
				.where(eq(DB_SCHEMA.sponsors.sponsorId, sponsorId))
				.limit(1),
			(error) => {
				console.error(`DB QUERIES.getSponsorDetails (sponsor): ${error}`);
				return new Error('Failed to get sponsor');
			}
		);

		const videosResult = await ResultAsync.fromPromise(
			dbClient
				.select({
					video: DB_SCHEMA.videos
				})
				.from(DB_SCHEMA.sponsorToVideos)
				.innerJoin(
					DB_SCHEMA.videos,
					eq(DB_SCHEMA.videos.ytVideoId, DB_SCHEMA.sponsorToVideos.ytVideoId)
				)
				.where(eq(DB_SCHEMA.sponsorToVideos.sponsorId, sponsorId))
				.orderBy(desc(DB_SCHEMA.videos.publishedAt)),
			(error) => {
				console.error(`DB QUERIES.getSponsorDetails (videos): ${error}`);
				return new Error('Failed to get sponsor videos');
			}
		);

		const sponsorMatch = await sponsorResult;
		const videosMatch = await videosResult;

		if (sponsorMatch.isErr()) {
			return {
				status: 'error' as const,
				message: sponsorMatch.error.message,
				cause: sponsorMatch.error
			};
		}

		if (videosMatch.isErr()) {
			return {
				status: 'error' as const,
				message: videosMatch.error.message,
				cause: videosMatch.error
			};
		}

		const sponsor = sponsorMatch.value[0];
		if (!sponsor) {
			return {
				status: 'error' as const,
				message: 'Sponsor not found',
				cause: null
			};
		}

		const videos = videosMatch.value.map((v) => v.video);
		const totalViews = videos.reduce((sum: number, v) => sum + v.viewCount, 0);
		const totalAds = videos.length;
		const lastPublishDate = videos.length > 0 ? videos[0].publishedAt.getTime() : null;

		return {
			status: 'success' as const,
			data: {
				sponsor,
				videos,
				stats: {
					totalViews,
					totalAds,
					lastPublishDate
				}
			}
		};
	},

	getVideoDetails: async (ytVideoId: string) => {
		const videoResult = await ResultAsync.fromPromise(
			dbClient
				.select()
				.from(DB_SCHEMA.videos)
				.where(eq(DB_SCHEMA.videos.ytVideoId, ytVideoId))
				.limit(1),
			(error) => {
				console.error(`DB QUERIES.getVideoDetails (video): ${error}`);
				return new Error('Failed to get video');
			}
		);

		const videoMatch = await videoResult;
		if (videoMatch.isErr()) {
			return {
				status: 'error' as const,
				message: videoMatch.error.message,
				cause: videoMatch.error
			};
		}

		const video = videoMatch.value[0];
		if (!video) {
			return {
				status: 'error' as const,
				message: 'Video not found',
				cause: null
			};
		}

		const channelResult = await ResultAsync.fromPromise(
			dbClient
				.select()
				.from(DB_SCHEMA.channels)
				.where(eq(DB_SCHEMA.channels.ytChannelId, video.ytChannelId))
				.limit(1),
			(error) => {
				console.error(`DB QUERIES.getVideoDetails (channel): ${error}`);
				return new Error('Failed to get channel');
			}
		);

		const sponsorResult = await ResultAsync.fromPromise(
			dbClient
				.select({
					sponsor: DB_SCHEMA.sponsors
				})
				.from(DB_SCHEMA.sponsorToVideos)
				.innerJoin(
					DB_SCHEMA.sponsors,
					eq(DB_SCHEMA.sponsors.sponsorId, DB_SCHEMA.sponsorToVideos.sponsorId)
				)
				.where(eq(DB_SCHEMA.sponsorToVideos.ytVideoId, ytVideoId))
				.limit(1),
			(error) => {
				console.error(`DB QUERIES.getVideoDetails (sponsor): ${error}`);
				return new Error('Failed to get sponsor');
			}
		);

		const commentsResult = await ResultAsync.fromPromise(
			dbClient
				.select()
				.from(DB_SCHEMA.comments)
				.where(eq(DB_SCHEMA.comments.ytVideoId, ytVideoId))
				.orderBy(desc(DB_SCHEMA.comments.publishedAt)),
			(error) => {
				console.error(`DB QUERIES.getVideoDetails (comments): ${error}`);
				return new Error('Failed to get comments');
			}
		);

		const notificationsResult = await ResultAsync.fromPromise(
			dbClient
				.select()
				.from(DB_SCHEMA.notifications)
				.where(eq(DB_SCHEMA.notifications.ytVideoId, ytVideoId))
				.orderBy(desc(DB_SCHEMA.notifications.createdAt)),
			(error) => {
				console.error(`DB QUERIES.getVideoDetails (notifications): ${error}`);
				return new Error('Failed to get notifications');
			}
		);

		const channelMatch = await channelResult;
		const sponsorMatch = await sponsorResult;
		const commentsMatch = await commentsResult;
		const notificationsMatch = await notificationsResult;

		if (channelMatch.isErr()) {
			return {
				status: 'error' as const,
				message: channelMatch.error.message,
				cause: channelMatch.error
			};
		}

		if (sponsorMatch.isErr()) {
			return {
				status: 'error' as const,
				message: sponsorMatch.error.message,
				cause: sponsorMatch.error
			};
		}

		if (commentsMatch.isErr()) {
			return {
				status: 'error' as const,
				message: commentsMatch.error.message,
				cause: commentsMatch.error
			};
		}

		if (notificationsMatch.isErr()) {
			return {
				status: 'error' as const,
				message: notificationsMatch.error.message,
				cause: notificationsMatch.error
			};
		}

		const channel = channelMatch.value[0] || null;
		const sponsor = sponsorMatch.value[0]?.sponsor || null;

		return {
			status: 'success' as const,
			data: {
				video,
				channel,
				sponsor,
				comments: commentsMatch.value,
				notifications: notificationsMatch.value
			}
		};
	}
};
