import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import { getDrizzleInstance, type DbConnection } from '@r8y/db';

const globalForDb = globalThis as unknown as {
	client: DbConnection | undefined;
};

const getClient = () => {
	if (building) {
		throw new Error('Cannot access database during build');
	}

	if (!globalForDb.client) {
		globalForDb.client = getDrizzleInstance(env.MYSQL_URL);
	}

	return globalForDb.client;
};

export const dbClient = new Proxy({} as DbConnection, {
	get: (_, prop) => {
		const client = getClient();
		return client[prop as keyof DbConnection];
	}
});
