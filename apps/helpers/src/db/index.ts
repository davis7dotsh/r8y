import { getDrizzleInstance } from '@r8y/db';

export const dbClient = getDrizzleInstance(Bun.env.MYSQL_URL!);
