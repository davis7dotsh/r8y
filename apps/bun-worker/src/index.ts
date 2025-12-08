import { BunRuntime } from '@effect/platform-bun';
import { ChannelSyncService, DbService } from '@r8y/channel-sync';
import { Effect, Layer, Schedule } from 'effect';

const appLayer = Layer.provideMerge(ChannelSyncService.Default, DbService.Default);

const runSync = Effect.fn('BgWorker.runSync')(function* () {
	const channelSync = yield* ChannelSyncService;
	yield* Effect.log('starting sync');
	yield* channelSync.syncAllChannels();
	yield* Effect.log('finished sync');
});

const program = runSync().pipe(
	Effect.catchAllCause((cause) => Effect.logError('sync failed', cause)),
	Effect.repeat(Schedule.spaced('20 minutes')),
	Effect.provide(appLayer),
	Effect.withSpan('BgWorker.main')
);

BunRuntime.runMain(program);
