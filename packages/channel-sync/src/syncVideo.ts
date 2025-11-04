import { err, ok } from 'neverthrow';
import { getVideoComments, getVideoDetails } from './youtube/helpers';
import { DB_MUTATIONS, DB_QUERIES } from './db';
import { classifyComment, getSponsor } from './ai/helpers';
import { sendVideoLiveToDiscord } from './notifications/discord';
import { sendVideoLiveToTodoist } from './notifications/todoist';

class SyncVideoError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'SyncVideoError';
	}
}

export const syncVideo = async (args: { ytVideoId: string }) => {
	const videoDetails = await getVideoDetails(args);

	if (videoDetails.isErr()) {
		return err(new SyncVideoError(videoDetails.error.message));
	}

	const upsertVideoResult = await DB_MUTATIONS.upsertVideo({
		ytVideoId: args.ytVideoId,
		ytChannelId: videoDetails.value.channelId,
		title: videoDetails.value.title,
		description: videoDetails.value.description,
		thumbnailUrl: videoDetails.value.thumbnailUrl,
		publishedAt: new Date(videoDetails.value.publishedAt),
		viewCount: videoDetails.value.viewCount,
		likeCount: videoDetails.value.likeCount,
		commentCount: videoDetails.value.commentCount
	});

	if (upsertVideoResult.isErr()) {
		return err(new SyncVideoError(upsertVideoResult.error.message));
	}

	const { wasInserted } = upsertVideoResult.value;

	const channelResult = await DB_QUERIES.getChannel(videoDetails.value.channelId);

	if (channelResult.isErr()) {
		return err(new SyncVideoError(channelResult.error.message));
	} else if (!channelResult.value) {
		return err(new SyncVideoError('Channel not found'));
	}

	const channel = channelResult.value;

	const currentSponsorResult = await DB_QUERIES.getSponsorForVideo(args.ytVideoId);
	if (currentSponsorResult.isErr()) {
		return err(new SyncVideoError(currentSponsorResult.error.message));
	}

	const currentSponsor = currentSponsorResult.value;

	let sponsor: { name: string } = currentSponsor
		? { name: currentSponsor.name }
		: { name: 'No sponsor' };

	if (!currentSponsor) {
		const sponsorResult = await getSponsor({
			sponsorPrompt: channel.findSponsorPrompt,
			videoDescription: videoDetails.value.description
		});

		if (sponsorResult.isOk()) {
			sponsor = { name: sponsorResult.value.sponsorName };

			const existingSponsor = await DB_QUERIES.getSponsorByKey(sponsorResult.value.sponsorKey);

			if (existingSponsor.isOk() && existingSponsor.value) {
				const attachSponsorResult = await DB_MUTATIONS.attachSponsorToVideo({
					sponsorId: existingSponsor.value.sponsorId,
					ytVideoId: args.ytVideoId
				});

				if (attachSponsorResult.isErr()) {
					return err(new SyncVideoError(attachSponsorResult.error.message));
				}
			} else {
				const newSponsorResult = await DB_MUTATIONS.createSponsor({
					ytChannelId: channel.ytChannelId,
					sponsorKey: sponsorResult.value.sponsorKey,
					name: sponsorResult.value.sponsorName
				});

				if (newSponsorResult.isErr()) {
					return err(new SyncVideoError(newSponsorResult.error.message));
				}

				const attachSponsorResult = await DB_MUTATIONS.attachSponsorToVideo({
					sponsorId: newSponsorResult.value,
					ytVideoId: args.ytVideoId
				});

				if (attachSponsorResult.isErr()) {
					return err(new SyncVideoError(attachSponsorResult.error.message));
				}
			}
		}
	}

	if (wasInserted) {
		await sendVideoLiveToDiscord(
			{
				ytVideoId: args.ytVideoId,
				title: videoDetails.value.title
			},
			sponsor
		);
		await sendVideoLiveToTodoist(
			{
				ytVideoId: args.ytVideoId,
				title: videoDetails.value.title
			},
			sponsor
		);
	}

	const commentsResult = await getVideoComments(args);

	if (commentsResult.isErr()) {
		return err(new SyncVideoError(commentsResult.error.message));
	}

	const upsertCommentsResult = await DB_MUTATIONS.bulkUpsertComments({
		ytVideoId: args.ytVideoId,
		comments: commentsResult.value.map((comment) => ({
			ytCommentId: comment.ytCommentId,
			text: comment.text,
			author: comment.author,
			publishedAt: comment.publishedAt,
			likeCount: comment.likeCount,
			replyCount: comment.replyCount
		}))
	});

	if (upsertCommentsResult.isErr()) {
		return err(new SyncVideoError(upsertCommentsResult.error.message));
	}

	const allCommentsResult = await DB_QUERIES.getAllCommentsByVideoId(args.ytVideoId);

	if (allCommentsResult.isErr()) {
		return err(new SyncVideoError(allCommentsResult.error.message));
	}

	const allComments = allCommentsResult.value;

	const commentSentimentResults = await Promise.allSettled(
		allComments.map(async (comment) => {
			return await handleCommentSentiment({
				ytCommentId: comment.ytCommentId,
				text: comment.text,
				author: comment.author,
				likeCount: comment.likeCount,
				replyCount: comment.replyCount,
				isProcessed: comment.isProcessed,
				sponsor: { name: sponsor.name }
			});
		})
	);

	commentSentimentResults.forEach((result) => {
		if (result.status === 'fulfilled') {
			if (result.value.isErr()) {
				console.error('Failed to process comment sentiment:', result.value.error.message);
			}
		}
	});

	return ok(undefined);
};

const handleCommentSentiment = async (args: {
	ytCommentId: string;
	text: string;
	author: string;
	likeCount: number;
	replyCount: number;
	isProcessed: boolean;
	sponsor: { name: string };
}) => {
	if (args.isProcessed) {
		return ok(undefined);
	}

	const classificationResult = await classifyComment({
		comment: args.text,
		videoSponsor: args.sponsor.name
	});

	if (classificationResult.isErr()) {
		return err(new SyncVideoError(classificationResult.error.message));
	}

	const classification = classificationResult.value;

	const patchCommentSentimentResult = await DB_MUTATIONS.patchCommentSentiment({
		ytCommentId: args.ytCommentId,
		isEditingMistake: classification.isEditingMistake,
		isSponsorMention: classification.isSponsorMention,
		isQuestion: classification.isQuestion,
		isPositiveComment: classification.isPositiveComment
	});

	if (patchCommentSentimentResult.isErr()) {
		return err(new SyncVideoError(patchCommentSentimentResult.error.message));
	}

	return ok(undefined);
};
