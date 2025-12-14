import { Command, Prompt } from '@effect/cli';
import { BunContext, BunRuntime } from '@effect/platform-bun';
import { Effect, Layer } from 'effect';
import { ChannelSyncService, DbService } from '..';

const program = (args: ReadonlyArray<string>) =>
	Effect.scoped(
		Effect.gen(function* () {
			const db = yield* DbService;
			const channelSync = yield* ChannelSyncService;

			const backfillCommand = Command.make('backfill', {}, () =>
				Effect.gen(function* () {
					yield* Effect.log('Fetching channels...');

					const channels = yield* db.getAllChannels();

					if (channels.length === 0) {
						yield* Effect.log('No channels found. Please seed the database first.');
						return;
					}

					const selectedChannel = yield* Prompt.select({
						message: 'Select a channel to backfill:',
						choices: channels.map((channel) => ({
							title: channel.name,
							value: channel.ytChannelId,
							description: channel.ytChannelId
						}))
					});

					const channel = channels.find((c) => c.ytChannelId === selectedChannel);

					const maxVideos = yield* Prompt.integer({
						message: 'How many videos to backfill? (max 2000)',
						validate: (n) => (n > 0 && n <= 2000 ? Effect.succeed(n) : Effect.fail('Enter 1-2000'))
					});

					const confirmed = yield* Prompt.confirm({
						message: `Backfill ${maxVideos} videos from "${channel?.name}"? This may take a while.`
					});

					if (!confirmed) {
						yield* Effect.log('Aborted.');
						return;
					}

					yield* Effect.log(`Starting backfill for channel: ${channel?.name}`);
					yield* channelSync.backfillChannel({ ytChannelId: selectedChannel, maxVideos });
					yield* Effect.log('Backfill completed successfully');
				})
			);

			const rootCommand = Command.make('', {}, () =>
				Effect.log('R8Y Backfill CLI, run --help for available commands')
			).pipe(Command.withSubcommands([backfillCommand]));

			yield* Command.run(rootCommand, {
				name: '@r8y/backfill-cli',
				version: 'INTERNAL'
			})(args);
		})
	);

const MainLayer = ChannelSyncService.Default.pipe(
	Layer.provideMerge(DbService.Default),
	Layer.provideMerge(BunContext.layer)
);

program(process.argv).pipe(Effect.provide(MainLayer), BunRuntime.runMain);
