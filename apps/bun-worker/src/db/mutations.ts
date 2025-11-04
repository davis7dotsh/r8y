import { ResultAsync } from 'neverthrow';
import { randomBytes } from 'crypto';
import { dbClient } from '.';
import { DB_SCHEMA, eq, sql } from '@r8y/db';
import { DB_QUERIES } from './queries';

const generateId = () => randomBytes(16).toString('hex');

export const DB_MUTATIONS = {};
