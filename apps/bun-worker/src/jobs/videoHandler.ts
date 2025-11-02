import { DB_QUERIES, DB_MUTATIONS } from '../db';
import { getVideoComments } from '../youtube/helpers';
import { classifyComment, getSponsor } from '../ai/helpers';
import { sendVideoLiveToDiscord, sendFlaggedCommentToDiscord } from '../notifications/discord';
import { sendVideoLiveToTodoist } from '../notifications/todoist';

export const videoHandler = async (payload: unknown) => {
	const { ytVideoId, wasInserted } = payload as { ytVideoId: string; wasInserted: boolean };

	const WORKFLOW_START_TIME = Date.now();
	const WORKFLOW_DISPLAY_KEY = `syncVideo-${ytVideoId}-${WORKFLOW_START_TIME}`;

	console.log(`${WORKFLOW_DISPLAY_KEY} - Starting video sync`);

	if (wasInserted) {
		try {
			const video = await DB_QUERIES.getVideo(ytVideoId);
			if (!video) {
				throw new Error('Video not found');
			}

			const sponsorAttachment = await DB_QUERIES.getSponsorAttachmentByVideoId(ytVideoId);
			let sponsor: { name: string } | null = null;
			if (sponsorAttachment) {
				const sponsorData = await DB_QUERIES.getSponsorById(sponsorAttachment.sponsorId);
				if (sponsorData) {
					sponsor = { name: sponsorData.name };
				}
			}

			await sendVideoLiveToDiscord(video, sponsor);
		} catch (error) {
			console.error(`${WORKFLOW_DISPLAY_KEY} - Failed to send video live to Discord:`, error);
		}

		try {
			const video = await DB_QUERIES.getVideo(ytVideoId);
			if (!video) {
				throw new Error('Video not found');
			}

			const sponsorAttachment = await DB_QUERIES.getSponsorAttachmentByVideoId(ytVideoId);
			let sponsor: { name: string } | null = null;
			if (sponsorAttachment) {
				const sponsorData = await DB_QUERIES.getSponsorById(sponsorAttachment.sponsorId);
				if (sponsorData) {
					sponsor = { name: sponsorData.name };
				}
			}

			await sendVideoLiveToTodoist(video, sponsor);
		} catch (error) {
			console.error(`${WORKFLOW_DISPLAY_KEY} - Failed to send video live to Todoist:`, error);
		}
	}

	try {
		const video = await DB_QUERIES.getVideo(ytVideoId);
		if (!video) {
			throw new Error('Video not found');
		}

		const currentSponsorAttachment = await DB_QUERIES.getSponsorAttachmentByVideoId(ytVideoId);

		if (!currentSponsorAttachment) {
			const channel = await DB_QUERIES.getChannel(video.ytChannelId);
			if (!channel) {
				throw new Error('Channel not found');
			}

			const sponsor = await getSponsor({
				sponsorPrompt: channel.findSponsorPrompt,
				videoDescription: video.description
			});

			const existingSponsor = await DB_QUERIES.getSponsorByKey(sponsor.sponsorKey);

			if (existingSponsor) {
				await DB_MUTATIONS.attachSponsorToVideo({
					sponsorId: existingSponsor.sponsorId,
					ytVideoId: ytVideoId
				});
			} else {
				const newSponsorId = await DB_MUTATIONS.createSponsor({
					ytChannelId: channel.ytChannelId,
					sponsorKey: sponsor.sponsorKey,
					name: sponsor.sponsorName
				});
				await DB_MUTATIONS.attachSponsorToVideo({
					sponsorId: newSponsorId,
					ytVideoId: ytVideoId
				});
			}
		}

		console.log(`${WORKFLOW_DISPLAY_KEY} - Got sponsor for video`);
	} catch (error) {
		console.error(`${WORKFLOW_DISPLAY_KEY} - Failed to get sponsor:`, error);
	}

	let commentIds: string[] = [];

	try {
		const video = await DB_QUERIES.getVideo(ytVideoId);
		if (!video) {
			throw new Error('Video not found');
		}

		const comments = await getVideoComments({
			ytVideoId: video.ytVideoId,
			maxResults: 60
		});

		for (const comment of comments) {
			try {
				const commentId = await DB_MUTATIONS.upsertComment({
					ytCommentId: comment.ytCommentId,
					ytVideoId: ytVideoId,
					text: comment.text,
					author: comment.author,
					publishedAt: new Date(comment.publishedAt),
					likeCount: comment.likeCount,
					replyCount: comment.replyCount
				});
				commentIds.push(commentId);
			} catch (error) {
				console.error(`${WORKFLOW_DISPLAY_KEY} - Failed to upsert comment:`, error);
			}
		}

		console.log(`${WORKFLOW_DISPLAY_KEY} - Fetched and upserted ${commentIds.length} comments`);
	} catch (error) {
		console.error(`${WORKFLOW_DISPLAY_KEY} - Failed to fetch comments:`, error);
	}

	const BATCH_SIZE = 10;
	for (let i = 0; i < commentIds.length; i += BATCH_SIZE) {
		const batch = commentIds.slice(i, i + BATCH_SIZE);
		console.log(
			`${WORKFLOW_DISPLAY_KEY} - Processing sentiment for batch ${i / BATCH_SIZE + 1} of ${Math.ceil(commentIds.length / BATCH_SIZE)} (${batch.length} comments)`
		);

		await Promise.all(
			batch.map(async (commentId) => {
				try {
					const comment = await DB_QUERIES.getComment(commentId);

					if (!comment) {
						console.error(`${WORKFLOW_DISPLAY_KEY} - Comment not found: ${commentId}`);
						return;
					}

					if (comment.isProcessed) {
						return;
					}

					const video = await DB_QUERIES.getVideo(comment.ytVideoId);
					if (!video) {
						console.error(`${WORKFLOW_DISPLAY_KEY} - Video not found for comment: ${commentId}`);
						return;
					}

					let sponsorName: string | null = null;
					const sponsorAttachment = await DB_QUERIES.getSponsorAttachmentByVideoId(comment.ytVideoId);

					if (sponsorAttachment) {
						const sponsor = await DB_QUERIES.getSponsorById(sponsorAttachment.sponsorId);
						sponsorName = sponsor?.name || null;
					}

					const classification = await classifyComment({
						comment: comment.text,
						videoSponsor: sponsorName
					});

					await DB_MUTATIONS.patchCommentSentiment({
						ytCommentId: commentId,
						isEditingMistake: classification.isEditingMistake,
						isSponsorMention: classification.isSponsorMention,
						isQuestion: classification.isQuestion,
						isPositiveComment: classification.isPositiveComment
					});

					if (classification.isEditingMistake || classification.isSponsorMention) {
						try {
							await sendFlaggedCommentToDiscord(
								{
									ytCommentId: comment.ytCommentId,
									text: comment.text,
									likeCount: comment.likeCount,
									author: comment.author,
									publishedAt: new Date(comment.publishedAt)
								},
								video
							);
						} catch (error) {
							console.error(
								`${WORKFLOW_DISPLAY_KEY} - Failed to send flagged comment notification:`,
								error
							);
						}
					}
				} catch (error) {
					console.error(`${WORKFLOW_DISPLAY_KEY} - Failed to process comment sentiment:`, error);
				}
			})
		);
	}

	console.log(`${WORKFLOW_DISPLAY_KEY} - Processed sentiment for ${commentIds.length} comments`);

	console.log(
		`${WORKFLOW_DISPLAY_KEY} - Video sync completed in ${Date.now() - WORKFLOW_START_TIME}ms`
	);
};

