import { dbClient } from '$lib/db';
import { DB_SCHEMA } from '@r8y/db';

export const load = async () => {
	const result = await dbClient.select().from(DB_SCHEMA.channels);

	return {
		channels: result
	};
};
