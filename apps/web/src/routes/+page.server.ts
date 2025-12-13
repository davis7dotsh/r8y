import { fail, redirect } from '@sveltejs/kit';
import { runner } from '$lib/server/runner';
import { Effect } from 'effect';
import { AuthService } from '$lib/services/auth';

export const load = async (event) => {
	const isAuthenticated = await runner(
		Effect.gen(function* () {
			const auth = yield* AuthService;
			return yield* auth.checkAuth(event);
		})
	);

	return { isAuthenticated };
};

export const actions = {
	signin: async (event) => {
		const formData = await event.request.formData();
		const authPassword = formData.get('authPassword');

		if (!authPassword || typeof authPassword !== 'string') {
			return fail(400, { error: 'Password is required' });
		}

		const result = await runner(
			Effect.gen(function* () {
				const auth = yield* AuthService;
				return yield* auth.signIn({ event, authPassword });
			})
		);

		if (!result.success) {
			return fail(401, { error: 'Invalid password' });
		}

		redirect(302, '/app');
	}
};
