import { drizzle } from 'drizzle-orm/mysql2';

export const getDbConnection = (dbUrl: string) => {
	return drizzle(dbUrl);
};

export type DbConnection = ReturnType<typeof getDbConnection>;
