import { ResultAsync } from 'neverthrow';
import { dbClient } from '.';
import { DB_SCHEMA } from '@r8y/db';

export const DB_MUTATIONS = {
	createChannel: async (data: {
		channelName: string;
		findSponsorPrompt: string;
		ytChannelId: string;
	}) => {
		const createChannelResult = await ResultAsync.fromPromise(
			dbClient.insert(DB_SCHEMA.channels).values({
				name: data.channelName,
				ytChannelId: data.ytChannelId,
				findSponsorPrompt: data.findSponsorPrompt
			}),
			(error) => {
				console.error(`DB MUTATIONS.createChannel: ${error}`);
				return new Error(`Failed to create channel`);
			}
		);

		return createChannelResult.match(
			(result) => {
				return {
					status: 'success' as const,
					data: result
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
	}
};
