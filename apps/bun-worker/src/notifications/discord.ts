import { Client, GatewayIntentBits } from 'discord.js';
import { ResultAsync, err } from 'neverthrow';
import { DB_MUTATIONS } from '../db/mutations';

const discordClient = new Client({
	intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds]
});

const sendMessageToDiscord = async (message: string) => {
	await discordClient.login(Bun.env.DISCORD_BOT_TOKEN!);

	const channelResult = await ResultAsync.fromPromise(
		discordClient.channels.fetch(Bun.env.DISCORD_CHANNEL_ID!),
		(error) => new Error(`Failed to fetch channel: ${error}`)
	);

	if (channelResult.isErr()) {
		return channelResult;
	}

	const channel = channelResult.value;

	if (!channel || !channel.isSendable()) {
		return err(new Error('Channel not found or not sendable'));
	}

	const messageSendResult = await ResultAsync.fromPromise(
		channel.send(message) as Promise<any>,
		(error) => new Error(`Failed to send message: ${error}`)
	);

	return messageSendResult;
};

type VideoLiveMessageFields = {
	videoUrl: string;
	videoTitle: string;
	videoSponsor: string | null;
};

const videoLiveMessageTemplate = (fields: VideoLiveMessageFields) =>
	`<@&${Bun.env.DISCORD_ROLE_ID}> video just went live: *${fields.videoTitle}*

video sponsor: **${fields.videoSponsor || 'no sponsor'}**

video link: ${fields.videoUrl}

\`\`\`
────────────────────────────────────────
\`\`\`
`;

type FlaggedCommentMessageFields = {
	commentUrl: string;
	commentText: string;
	commentLikeCount: number | null;
	commentAuthorName: string | null;
	commentLeftAt: number;
};

const flaggedCommentMessageTemplate = (fields: FlaggedCommentMessageFields) => `
<@&${Bun.env.DISCORD_ROLE_ID}> flagged comment from *${fields.commentAuthorName || 'unknown'}*

left at: ${new Date(fields.commentLeftAt).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}

comment text: **${fields.commentText}**

like count: ${fields.commentLikeCount || 'unknown'}

comment link: <${fields.commentUrl}>

\`\`\`
────────────────────────────────────────
\`\`\`
`;

export const sendVideoLiveToDiscord = async (video: {
	ytVideoId: string;
	title: string;
}, sponsor: { name: string } | null) => {
	const videoUrl = `https://www.youtube.com/watch?v=${video.ytVideoId}`;

	const message = videoLiveMessageTemplate({
		videoUrl,
		videoTitle: video.title,
		videoSponsor: sponsor?.name || null
	});

	const result = await sendMessageToDiscord(message);

	if (result.isErr()) {
		const errorMessage = result.error instanceof Error ? result.error.message : String(result.error);
		console.error('DISCORD, failed to send message', errorMessage);
		await DB_MUTATIONS.logNotification({
			ytVideoId: video.ytVideoId,
			type: 'discord_video_live',
			success: false,
			message: `Failed to send message to Discord: ${errorMessage}`
		});
		return;
	}

	await DB_MUTATIONS.logNotification({
		ytVideoId: video.ytVideoId,
		type: 'discord_video_live',
		success: true,
		message: 'Message sent to Discord'
	});
};

export const sendFlaggedCommentToDiscord = async (
	comment: {
		ytCommentId: string;
		text: string;
		likeCount: number;
		author: string;
		publishedAt: Date;
	},
	video: {
		ytVideoId: string;
	}
) => {
	const commentUrl = `https://www.youtube.com/watch?v=${video.ytVideoId}&lc=${comment.ytCommentId}`;

	const message = flaggedCommentMessageTemplate({
		commentUrl,
		commentText: comment.text,
		commentLikeCount: comment.likeCount,
		commentAuthorName: comment.author,
		commentLeftAt: comment.publishedAt.getTime()
	});

	const result = await sendMessageToDiscord(message);

	if (result.isErr()) {
		const errorMessage = result.error instanceof Error ? result.error.message : String(result.error);
		console.error('DISCORD, failed to send flagged comment message', errorMessage);
		await DB_MUTATIONS.logNotification({
			ytVideoId: video.ytVideoId,
			type: 'discord_flagged_comment',
			success: false,
			message: `Failed to send flagged comment message to Discord: ${errorMessage}`,
			commentId: comment.ytCommentId
		});
		return;
	}

	await DB_MUTATIONS.logNotification({
		ytVideoId: video.ytVideoId,
		type: 'discord_flagged_comment',
		success: true,
		message: 'Flagged comment message sent to Discord',
		commentId: comment.ytCommentId
	});
};

