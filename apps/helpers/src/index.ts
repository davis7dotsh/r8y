import { Command } from '@effect/cli';
import { BunContext, BunRuntime } from '@effect/platform-bun';
import { Effect } from 'effect';

const wipeCommand = Command.make('wipe', {}, () => Effect.log('Wiping database...'));

const pushCommand = Command.make('push', {}, () => Effect.log('Pushing database schema...'));

const seedCommand = Command.make('seed', {}, () => Effect.log('Seeding database...'));

const dbCommand = Command.make('db', {}, () =>
	Effect.log('Database commands, run --help for available commands')
).pipe(Command.withSubcommands([wipeCommand, pushCommand, seedCommand]));

const rootCommand = Command.make('', {}, () =>
	Effect.log('R8Y Helpers, run --help for available commands')
).pipe(Command.withSubcommands([dbCommand]));

const cli = Command.run(rootCommand, {
	name: '@r8y/helpers',
	version: 'INTERNAL'
});

cli(process.argv).pipe(Effect.provide(BunContext.layer), BunRuntime.runMain);
