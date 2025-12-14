import { generateObject } from 'ai';
import z from 'zod';
import { Effect, Schedule } from 'effect';
import { TaggedError } from 'effect/Data';
import { createGroq } from '@ai-sdk/groq';

const retrySchedule = Schedule.intersect(Schedule.spaced('1 minute'), Schedule.recurs(3));

class AiError extends TaggedError('AiError') {
	constructor(message: string, options?: { cause?: unknown }) {
		super();
		this.message = message;
		this.cause = options?.cause;
	}
}

const aiService = Effect.gen(function* () {
	const groqApiKey = yield* Effect.sync(() => Bun.env.GROQ_API_KEY);

	if (!groqApiKey) {
		return yield* Effect.die('GROQ_API_KEY is not set');
	}

	const groq = createGroq({
		apiKey: groqApiKey
	});

	return {
		classifyComment: (data: { comment: string; videoSponsor: string | null }) =>
			Effect.gen(function* () {
				const classificationOutputSchema = z.object({
					isEditingMistake: z.boolean(),
					isSponsorMention: z.boolean(),
					isQuestion: z.boolean(),
					isPositiveComment: z.boolean()
				});

				const result = yield* Effect.tryPromise({
					try: () =>
						generateObject({
							model: groq('openai/gpt-oss-120b'),
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
						}),
					catch: (err) => {
						return new AiError('Failed to classify comment', { cause: err });
					}
				}).pipe(Effect.retry(retrySchedule));

				return result.object;
			}),

		getSponsor: (data: { sponsorPrompt: string; videoDescription: string }) =>
			Effect.gen(function* () {
				const sponsorOutputSchema = z.object({
					sponsorName: z.string(),
					sponsorKey: z.string()
				});

				const result = yield* Effect.tryPromise({
					try: () =>
						generateObject({
							model: groq('openai/gpt-oss-120b'),
							prompt: `Your job is to parse this youtube video's description to find the sponsor, and a key to identify the sponsor in the db. The following will tell you how to get each of those for this channel:
        
        ${data.sponsorPrompt}

        The video description is:
        ${data.videoDescription}
        `,
							schema: sponsorOutputSchema
						}),
					catch: (err) => new AiError('Failed to get sponsor', { cause: err })
				}).pipe(Effect.retry(retrySchedule));

				return result.object;
			})
	};
});

export class AiService extends Effect.Service<AiService>()('AiService', {
	effect: aiService
}) {}
