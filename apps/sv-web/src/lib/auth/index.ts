import { env } from '$env/dynamic/private';
import { AppError } from '$lib/helper/endpoint';
import type { RequestEvent } from '@sveltejs/kit';
import { Effect } from 'effect';

const authService = Effect.gen(function* () {
	const secretPassword = yield* Effect.sync(() => env.SECRET_PASSWORD);

	if (!secretPassword) {
		yield* Effect.die('SECRET_PASSWORD is not set');
	}

	const AUTH_PASSWORD_COOKIE_NAME = 'authPassword';

	const checkAuthAndFail = (event: RequestEvent) =>
		Effect.gen(function* () {
			const isAuthenticated = yield* checkAuth(event);
			if (!isAuthenticated) {
				yield* Effect.fail(
					new AppError(
						{
							type: 'auth',
							message: 'Unauthorized'
						},
						401
					)
				);
			}
		});

	const checkAuth = (event: RequestEvent) =>
		Effect.sync(() => {
			const authPassword = event.cookies.get(AUTH_PASSWORD_COOKIE_NAME);

			if (!authPassword) {
				return false;
			}

			if (authPassword !== secretPassword) {
				return false;
			}

			return true;
		});

	const signOut = (event: RequestEvent) =>
		Effect.sync(() => {
			event.cookies.delete(AUTH_PASSWORD_COOKIE_NAME, {
				path: '/'
			});

			return {
				success: true
			};
		});

	const signIn = (args: { event: RequestEvent; authPassword: string }) =>
		Effect.sync(() => {
			const { event, authPassword } = args;

			if (authPassword !== secretPassword) {
				return {
					success: false
				};
			}

			event.cookies.set(AUTH_PASSWORD_COOKIE_NAME, authPassword, {
				path: '/',
				httpOnly: true,
				secure: true,
				maxAge: 60 * 60 * 24 * 1000 * 1000 // 1000 days
			});

			return {
				success: true
			};
		});

	return {
		checkAuthAndFail,
		checkAuth,
		signOut,
		signIn
	};
});

export class AuthService extends Effect.Service<AuthService>()('AuthService', {
	dependencies: [],
	effect: authService
}) {}
