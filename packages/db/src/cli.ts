import { Command, Prompt } from '@effect/cli';
import { BunContext, BunRuntime } from '@effect/platform-bun';
import { Effect } from 'effect';
import { getDrizzleInstance } from './connection';
import type { DB_INSERT_MODELS } from './types';
import { DB_SCHEMA } from '.';

const SEED_CHANNELS = [
	{
		ytChannelId: 'UCbRP3c757lWg9M-U7TyEkXA',
		name: 'Theo (t3.gg)',
		findSponsorPrompt:
			"The sponsor key for this channel is `https://soydev.link/${SPONSOR_NAME}`. There are often multiple soydev links in the description. The one for the sponsor will come after something similar to 'Thank you ${SPONSOR_NAME} for sponsoring!'. If it doesn't mention that the sponsor name is a sponsor, then there is no sponsor and you should set the sponsor name to 'no sponsor' and the sponsor key to 'https://t3.gg'"
	},
	{
		ytChannelId: 'UCFvPgPdb_emE_bpMZq6hmJQ',
		name: 'Ben Davis',
		findSponsorPrompt:
			"The sponsor key for this channel is `https://davis7.link/${SPONSOR_NAME}`. There are often multiple davis7 links in the description. The one for the sponsor will come after something similar to 'Thank you ${SPONSOR_NAME} for sponsoring!'. If it doesn't mention that the sponsor name is a sponsor, then there is no sponsor and you should set the sponsor name to 'no sponsor' and the sponsor key to 'https://davis7.sh'"
	}
] satisfies DB_INSERT_MODELS['channels'][];

const program = (args: ReadonlyArray<string>) =>
	Effect.scoped(
		Effect.gen(function* () {
			const dbUrl = yield* Effect.sync(() => Bun.env.DATABASE_URL);

			if (!dbUrl) {
				return yield* Effect.die('DATABASE_URL is not set');
			}

			const db = yield* Effect.acquireRelease(
				Effect.try(() => getDrizzleInstance(dbUrl)),
				(db) => Effect.sync(() => db.$client.end())
			);

			const wipeCommand = Command.make('wipe', {}, () =>
				Effect.gen(function* () {
					const confirmed = yield* Prompt.confirm({
						message: 'This will wipe DB tables. Continue?'
					});

					if (!confirmed) {
						yield* Effect.log('Aborted.');
						return;
					}

					yield* Effect.log('Wiping DB tables...');

					yield* Effect.tryPromise(() => db.delete(DB_SCHEMA.sponsorToVideos));
					yield* Effect.log('Wiped sponsorToVideos');

					yield* Effect.tryPromise(() => db.delete(DB_SCHEMA.sponsors));
					yield* Effect.log('Wiped sponsors');

					yield* Effect.tryPromise(() => db.delete(DB_SCHEMA.videos));
					yield* Effect.log('Wiped videos');

					yield* Effect.tryPromise(() => db.delete(DB_SCHEMA.comments));
					yield* Effect.log('Wiped comments');

					yield* Effect.tryPromise(() => db.delete(DB_SCHEMA.notifications));
					yield* Effect.log('Wiped notifications');

					yield* Effect.tryPromise(() => db.delete(DB_SCHEMA.channels));
					yield* Effect.log('Wiped channels');

					yield* Effect.log('DB tables wiped successfully');
				})
			);

			const pushCommand = Command.make('push', {}, () =>
				Effect.gen(function* () {
					yield* Effect.log('Pushing database schema...');

					const proc = Bun.spawn(['bunx', 'drizzle-kit', 'push'], {
						stdout: 'inherit',
						stderr: 'inherit'
					});

					const exitCode = yield* Effect.promise(() => proc.exited);

					if (exitCode !== 0) {
						return yield* Effect.die(`drizzle-kit push failed with exit code ${exitCode}`);
					}

					yield* Effect.log('Database schema pushed successfully');
				})
			);

			const seedCommand = Command.make('seed', {}, () =>
				Effect.gen(function* () {
					yield* Effect.log('Seeding database...');

					const seedEffects = SEED_CHANNELS.map((channel) =>
						Effect.gen(function* () {
							yield* Effect.log(`Adding channel ${channel.name}...`);
							yield* Effect.tryPromise(() =>
								db.insert(DB_SCHEMA.channels).values(channel).returning({
									insertedId: DB_SCHEMA.channels.ytChannelId,
									createdAt: DB_SCHEMA.channels.createdAt
								})
							).pipe(
								Effect.matchEffect({
									onSuccess: (result) =>
										Effect.log(`Channel ${channel.name} added: ${result[0]?.insertedId}`),
									onFailure: (err) =>
										Effect.log(
											`Error adding channel ${channel.name} (it might already exist):\n ${err.cause}`
										)
								})
							);
						})
					);

					yield* Effect.all(seedEffects, { concurrency: 'unbounded' });

					yield* Effect.log('Database seeded');
				})
			);

			const rootCommand = Command.make('', {}, () =>
				Effect.log('R8Y DB Helper CLI, run --help for available commands')
			).pipe(Command.withSubcommands([wipeCommand, pushCommand, seedCommand]));

			yield* Command.run(rootCommand, {
				name: '@r8y/db-cli',
				version: 'INTERNAL'
			})(args);
		})
	);

program(process.argv).pipe(Effect.provide(BunContext.layer), BunRuntime.runMain);
