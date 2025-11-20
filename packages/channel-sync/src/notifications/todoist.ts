import { TodoistApi } from '@doist/todoist-api-typescript';
import { Effect } from 'effect';
import { DbService } from '../db';
import { TaggedError } from 'effect/Data';

class TodoistError extends TaggedError('TodoistError') {
	constructor(message: string, options?: { cause?: unknown }) {
		super();
		this.message = message;
		this.cause = options?.cause;
	}
}

const todoistService = Effect.gen(function* () {
	const todoistApiToken = yield* Effect.sync(() => Bun.env.TODOIST_API_TOKEN);

	if (!todoistApiToken) {
		return yield* Effect.die('TODOIST_API_TOKEN is not set');
	}

	const todoistApi = new TodoistApi(todoistApiToken);

	const db = yield* DbService;

	return {
		sendVideoLiveToTodoist: (
			video: {
				ytVideoId: string;
				title: string;
			},
			sponsor: { name: string } | null,
			options?: { isBackfill?: boolean }
		) =>
			Effect.gen(function* () {
				// Skip sending notification if this is a backfill operation
				if (options?.isBackfill) {
					yield* Effect.log('Skipping Todoist notification for backfill video');
					return;
				}

				const videoUrl = `https://www.youtube.com/watch?v=${video.ytVideoId}`;

				yield* Effect.tryPromise({
					try: () =>
						todoistApi.addTask({
							content: `${videoUrl} is live, sponsored by ${sponsor?.name || 'no one'}`,
							dueString: 'today',
							labels: ['youtube']
						}),
					catch: (err) => new TodoistError('Failed to add task to Todoist', { cause: err })
				}).pipe(
					Effect.tap(() =>
						db.logNotification({
							ytVideoId: video.ytVideoId,
							type: 'todoist_video_live',
							success: true,
							message: 'Video live task added to Todoist'
						})
					),
					Effect.catchTag('TodoistError', (err) => {
						const errorMessage = err.message;
						console.error('TODOIST, failed to add video live task', errorMessage);
						return db.logNotification({
							ytVideoId: video.ytVideoId,
							type: 'todoist_video_live',
							success: false,
							message: `Failed to add video live task to Todoist: ${errorMessage}`
						});
					})
				);
			})
	};
});

export class TodoistService extends Effect.Service<TodoistService>()('TodoistService', {
	effect: todoistService
}) {}
