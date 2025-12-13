import { redirect } from '@sveltejs/kit';
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

	if (!isAuthenticated) {
		redirect(302, '/');
	}

	return { isAuthenticated };
};
