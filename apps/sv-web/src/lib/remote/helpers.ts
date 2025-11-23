import { DbError, DbService } from '$lib/services/db';
import { error } from '@sveltejs/kit';
import { Effect, Cause, ManagedRuntime, Layer } from 'effect';
import { AuthError, AuthService } from '$lib/services/auth';
import { TaggedError } from 'effect/Data';
import { dev } from '$app/environment';

export class AppError extends TaggedError('AppError') {
	status: number;
	body: App.Error;
	constructor(body: App.Error, status = 500) {
		super();
		this.message = body.message;
		this.cause = body.cause;
		this.body = body;
		this.status = status;
	}
}

const globalForRuntime = globalThis as unknown as {
	client: ManagedRuntime.ManagedRuntime<DbService | AuthService, never> | undefined;
};

const getRuntime = () => {
	if (!globalForRuntime.client) {
		globalForRuntime.client = ManagedRuntime.make(
			Layer.mergeAll(DbService.Default, AuthService.Default)
		);
	}

	return globalForRuntime.client;
};

process.on('sveltekit:shutdown', async (reason) => {
	console.log('sveltekit:shutdown', reason);
	await getRuntime().dispose();
});

export const remoteRunner = async <A>(
	effect: Effect.Effect<A, AuthError | DbError | AppError, DbService | AuthService>
) => {
	const result = await effect.pipe(
		Effect.catchTag('DbError', (err) =>
			Effect.fail(
				new AppError({
					type: 'db',
					message: err.message,
					cause: err.cause
				})
			)
		),
		Effect.catchTag('AuthError', (err) =>
			Effect.fail(
				new AppError(
					{
						type: 'auth',
						message: err.message,
						cause: err.cause
					},
					401
				)
			)
		),
		Effect.matchCause({
			onSuccess: (res): { _type: 'success'; value: A } => ({
				_type: 'success',
				value: res
			}),
			onFailure: (cause): { _type: 'failure'; value: AppError } => {
				console.error(cause.toString());

				const failures = Array.from(Cause.failures(cause));

				if (failures.length > 0) {
					failures.forEach((failure) => {
						console.error(failure.toString());
						console.error('CAUSE', failure.cause);
					});
					const first = failures[0];
					if (first) {
						return {
							_type: 'failure',
							value: first
						};
					}
				}

				return {
					_type: 'failure',
					value: new AppError(
						{
							type: 'unknown',
							message: 'An unexpected error occurred',
							cause: cause.toString()
						},
						500
					)
				};
			}
		}),
		getRuntime().runPromise
	);

	if (result._type === 'failure') {
		return error(result.value.status, result.value.body);
	}

	return result.value;
};
