import { Effect, Schedule } from 'effect';
import { TaggedError } from 'effect/Data';
import { b } from '../baml_client';

const retrySchedule = Schedule.intersect(Schedule.spaced('1 minute'), Schedule.recurs(2));

class AiError extends TaggedError('AiError') {
	constructor(message: string, options?: { cause?: unknown }) {
		super();
		this.message = message;
		this.cause = options?.cause;
	}
}

const aiService = Effect.gen(function* () {
	const openrouterApiKey = yield* Effect.sync(() => Bun.env.OPENROUTER_API_KEY);

	if (!openrouterApiKey) {
		return yield* Effect.die('OPENROUTER_API_KEY is not set');
	}

	return {
		classifyComment: (data: { comment: string; videoSponsor: string | null }) =>
			Effect.gen(function* () {
				const result = yield* Effect.tryPromise({
					try: () => b.ClassifyComment(data.comment, data.videoSponsor),
					catch: (err) => {
						return new AiError('Failed to classify comment', { cause: err });
					}
				}).pipe(Effect.retry(retrySchedule));

				return result;
			}),

		getSponsor: (data: { sponsorPrompt: string; videoDescription: string }) =>
			Effect.gen(function* () {
				const result = yield* Effect.tryPromise({
					try: () => b.GetSponsor(data.sponsorPrompt, data.videoDescription.toLocaleLowerCase()),
					catch: (err) => new AiError('Failed to get sponsor', { cause: err })
				}).pipe(Effect.retry(retrySchedule));

				return result;
			})
	};
});

export class AiService extends Effect.Service<AiService>()('AiService', {
	effect: aiService
}) {}
