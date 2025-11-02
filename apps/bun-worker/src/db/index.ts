import { getDbConnection } from '@r8y/db';
import { RedisClient } from 'bun';

export const dbClient = getDbConnection(Bun.env.DATABASE_URL!);

export const redisDbClient = new RedisClient(Bun.env.REDIS_URL!);

export * from './queries';
export * from './mutations';
