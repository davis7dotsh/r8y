import { ManagedRuntime } from 'effect';
import { DbService } from './db';

export const runtime = ManagedRuntime.make(DbService.Default);
