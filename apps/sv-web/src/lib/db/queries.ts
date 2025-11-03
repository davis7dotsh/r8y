import { ResultAsync } from 'neverthrow';
import { dbClient } from '.';
import { DB_SCHEMA } from '@r8y/db';

export const DB_QUERIES = {
	getAllChannels: async () => {
		const channelsResult = await ResultAsync.fromPromise(
			dbClient.select().from(DB_SCHEMA.channels),
			(error) => {
				console.error(`DB QUERIES.getAllChannels: ${error}`);
				return new Error('Failed to get all channels');
			}
		);

		return channelsResult.match(
			(channels) => {
				return {
					status: 'success' as const,
					data: channels
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
