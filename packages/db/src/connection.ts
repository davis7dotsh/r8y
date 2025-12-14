import { drizzle } from 'drizzle-orm/node-postgres';
import * as mySchema from './schema';

export const getDrizzleInstance = (dbUrl: string) => drizzle(dbUrl, { schema: mySchema });

export type DbConnection = ReturnType<typeof getDrizzleInstance>;
