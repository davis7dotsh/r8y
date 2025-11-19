import { getDbConnection } from '@r8y/db';

export const dbClient = getDbConnection(Bun.env.MYSQL_URL!);

export * from './queries';
export * from './mutations';
