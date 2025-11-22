import { command, getRequestEvent } from '$app/server';
import z from 'zod';
import { Effect } from 'effect';
import { remoteRunner } from './helpers';
import { AuthService } from '$lib/services/auth';

export const remoteSignOut = command(async () => {
	return await remoteRunner(
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const event = yield* Effect.sync(() => getRequestEvent());
			return yield* auth.signOut(event);
		})
	);
});

export const remoteSignIn = command(
	z.object({
		authPassword: z.string()
	}),
	async ({ authPassword }) => {
		return await remoteRunner(
			Effect.gen(function* () {
				const auth = yield* AuthService;
				const event = yield* Effect.sync(() => getRequestEvent());
				return yield* auth.signIn({
					event,
					authPassword
				});
			})
		);
	}
);

export const remoteCheckAuth = command(async () => {
	return await remoteRunner(
		Effect.gen(function* () {
			const event = yield* Effect.sync(() => getRequestEvent());
			const auth = yield* AuthService;
			return yield* auth.checkAuth(event);
		})
	);
});
