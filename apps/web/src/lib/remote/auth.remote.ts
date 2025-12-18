import { command, form, getRequestEvent, query } from '$app/server';
import { AuthService } from '$lib/services/auth';
import { Effect, Schema } from 'effect';
import { remoteRunner } from './helpers';

export const remoteSignOut = command(async () => {
	return await remoteRunner(
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const event = yield* Effect.sync(() => getRequestEvent());
			return yield* auth.signOut(event);
		})
	);
});

const signInSchema = Schema.Struct({
	authPassword: Schema.String
}).pipe(Schema.standardSchemaV1);

export const remoteSignIn = form(signInSchema, async (formData) => {
	return await remoteRunner(
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const event = yield* Effect.sync(() => getRequestEvent());
			return yield* auth.signIn({ event, authPassword: formData.authPassword });
		})
	);
});

export const remoteCheckAuth = query(async () => {
	return await remoteRunner(
		Effect.gen(function* () {
			const auth = yield* AuthService;

			const event = yield* Effect.sync(() => getRequestEvent());

			const res = yield* auth.checkAuth(event);

			return res;
		})
	);
});
