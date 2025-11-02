import { generateObject } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import z from 'zod';

const openrouter = createOpenRouter({
	apiKey: Bun.env.OPENROUTER_API_KEY!,
	headers: {
		'HTTP-Referer': 'https://r8y.app',
		'X-Title': 'r8y'
	}
});

export const classifyComment = async (data: {
	comment: string;
	videoSponsor: string | null;
}) => {
	const classificationOutputSchema = z.object({
		isEditingMistake: z.boolean(),
		isSponsorMention: z.boolean(),
		isQuestion: z.boolean(),
		isPositiveComment: z.boolean()
	});

	try {
		const { object } = await generateObject({
			model: openrouter('openai/gpt-oss-120b', {
				provider: {
					only: ['groq']
				}
			}),
			prompt: `Your job is to classify this youtube video's comment. You need to return a boolean true/false for each of the following criteria:

            - The comment is flagging an editing mistake
            - The comment is flagging a packaging mistake (typo in title/description/thumbnail, missing link in description, etc.)
            - The comment mentions the video's sponsor (or the channel's sponsors in general)
            - The comment is a question
            - The comment is a positive comment (the general sentiment of the comment is positive, this should be true unless the comment is a direct complaint/critique, if it's neutral it should be true)

            The video sponsor is:
            ${data.videoSponsor || 'No sponsor'}

			The comment is:
			${data.comment}
            `,
			schema: classificationOutputSchema
		});
		return object;
	} catch (error) {
		console.error(error);
		throw new Error('Failed to classify comment with prompt');
	}
};

export const getSponsor = async (data: {
	sponsorPrompt: string;
	videoDescription: string;
}) => {
	const sponsorOutputSchema = z.object({
		sponsorName: z.string(),
		sponsorKey: z.string()
	});

	try {
		const { object } = await generateObject({
			model: openrouter('openai/gpt-oss-120b', {
				provider: {
					only: ['groq']
				}
			}),
			prompt: `Your job is to parse this youtube video's description to find the sponsor, and a key to identify the sponsor in the db. The following will tell you how to get each of those for this channel:
        
        ${data.sponsorPrompt}

        The video description is:
        ${data.videoDescription}
        `,
			schema: sponsorOutputSchema
		});
		return object;
	} catch (error) {
		console.error(error);
		throw new Error('Failed to get sponsor with prompt');
	}
};

