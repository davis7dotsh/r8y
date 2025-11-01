import { query } from '$app/server';
import { DB_SCHEMA } from '@r8y/db';
import { dbClient } from './db';

export const remoteDemo = query(async () => {
	const result = await dbClient.select().from(DB_SCHEMA.channels);

	return {
		channels: result
	};
});
