import type { InferInsertModel, InferSelectModel, Table } from 'drizzle-orm';
import * as schema from './schema';

type TableKeys = {
	[K in keyof typeof schema]: (typeof schema)[K] extends Table ? K : never;
}[keyof typeof schema];

export type DB_SELECT_MODELS = {
	[K in TableKeys]: InferSelectModel<(typeof schema)[K]>;
};

export type DB_INSERT_MODELS = {
	[K in TableKeys]: InferInsertModel<(typeof schema)[K]>;
};
