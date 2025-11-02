import { TodoistApi } from '@doist/todoist-api-typescript';
import { ResultAsync } from 'neverthrow';
import { DB_MUTATIONS } from '../db/mutations';

const todoistApi = new TodoistApi(Bun.env.TODOIST_API_TOKEN!);

export const sendVideoLiveToTodoist = async (
	video: {
		ytVideoId: string;
		title: string;
	},
	sponsor: { name: string } | null
) => {
	const videoUrl = `https://www.youtube.com/watch?v=${video.ytVideoId}`;

	const addTaskResult = await ResultAsync.fromPromise(
		todoistApi.addTask({
			content: `${videoUrl} is live, sponsored by ${sponsor?.name || 'no one'}`,
			dueString: 'today',
			labels: ['youtube']
		}),
		(error) => new Error(`Failed to add task to Todoist: ${error}`)
	);

	if (addTaskResult.isErr()) {
		console.error('TODOIST, failed to add video live task', addTaskResult.error);
		await DB_MUTATIONS.logNotification({
			ytVideoId: video.ytVideoId,
			type: 'todoist_video_live',
			success: false,
			message: `Failed to add video live task to Todoist: ${addTaskResult.error.message}`
		});
		return;
	}

	await DB_MUTATIONS.logNotification({
		ytVideoId: video.ytVideoId,
		type: 'todoist_video_live',
		success: true,
		message: 'Video live task added to Todoist'
	});
};

