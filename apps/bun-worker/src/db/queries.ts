import { ResultAsync } from 'neverthrow';
import { dbClient } from '.';
import { DB_SCHEMA, eq } from '@r8y/db';

export const DB_QUERIES = {
	getAllChannels: async () => {
		return ResultAsync.fromPromise(
			dbClient.select().from(DB_SCHEMA.channels),
			() => new Error('Failed to get all channels')
		);
	}
};
