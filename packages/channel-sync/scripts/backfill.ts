#!/usr/bin/env bun

import { ChannelSyncService, DbService } from '../src';
import { Effect, Layer } from 'effect';
import { parseArgs } from 'util';

const main = Effect.gen(function* () {
	// Parse command line arguments
	const { values } = parseArgs({
		args: Bun.argv,
		options: {
			id: {
				type: 'string',
				short: 'i'
			}
		},
		strict: true,
		allowPositionals: true
	});

	const channelId = values.id;

	if (!channelId) {
		console.error('Error: Channel ID is required');
		console.error('Usage: bun run backfill --id <channel-id>');
		console.error('   or: bun run backfill -i <channel-id>');
		process.exit(1);
	}

	console.log(`Starting backfill for channel: ${channelId}`);

	const channelSync = yield* ChannelSyncService;
	yield* channelSync.backfillChannel({ ytChannelId: channelId });
}).pipe(
	Effect.provide(Layer.provideMerge(ChannelSyncService.Default, DbService.Default)),
	Effect.matchCause({
		onSuccess: () => {
			console.log('Backfill completed successfully');
			process.exit(0);
		},
		onFailure: (cause) => {
			console.error('Backfill failed:', cause);
			process.exit(1);
		}
	})
);

Effect.runPromise(main);
