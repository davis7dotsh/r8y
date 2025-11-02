import { redisDbClient } from '../db';

export type JobType = 'channel' | 'video';

export type ChannelJob = {
	type: 'channel';
	payload: {
		ytChannelId: string;
	};
};

export type VideoJob = {
	type: 'video';
	payload: {
		ytVideoId: string;
		wasInserted: boolean;
	};
};

export type Job = ChannelJob | VideoJob;

export const enqueueJob = async (jobType: JobType, payload: unknown) => {
	const queueKey = `queue:${jobType}`;
	const job = JSON.stringify(payload);
	await redisDbClient.lpush(queueKey, job);
};

export const dequeueJob = async (jobType: JobType): Promise<unknown | null> => {
	const queueKey = `queue:${jobType}`;
	const result = await redisDbClient.brpop(queueKey, 1);
	if (!result || !result[1]) {
		return null;
	}
	return JSON.parse(result[1]);
};

export const dequeueJobs = async (jobType: JobType, count: number): Promise<unknown[]> => {
	const queueKey = `queue:${jobType}`;
	const jobs: unknown[] = [];

	for (let i = 0; i < count; i++) {
		const result = await redisDbClient.brpop(queueKey, 0.1);
		if (result && result[1]) {
			try {
				jobs.push(JSON.parse(result[1]));
			} catch (error) {
				console.error(`Error parsing job:`, error);
			}
		} else {
			break;
		}
	}

	return jobs;
};

export const startJobHandler = async (
	jobType: JobType,
	handler: (payload: unknown) => Promise<void>
) => {
	console.log(`Starting job handler for ${jobType}`);
	const BATCH_SIZE = 10;

	while (true) {
		try {
			const jobs = await dequeueJobs(jobType, BATCH_SIZE);

			if (jobs.length > 0) {
				await Promise.all(
					jobs.map(async (job) => {
						try {
							await handler(job);
						} catch (error) {
							console.error(`Error processing ${jobType} job:`, error);
						}
					})
				);
			} else {
				await Bun.sleep(100);
			}
		} catch (error) {
			console.error(`Error in ${jobType} job handler:`, error);
			await Bun.sleep(1000);
		}
	}
};
