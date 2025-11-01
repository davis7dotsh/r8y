export * as DB_SCHEMA from './schema';
export * from './connection';

import type * as DB_SCHEMA from './schema';

export type DBTypes = {
	[K in keyof typeof DB_SCHEMA]: (typeof DB_SCHEMA)[K] extends {
		$inferSelect: unknown;
	}
		? (typeof DB_SCHEMA)[K]['$inferSelect']
		: never;
};
