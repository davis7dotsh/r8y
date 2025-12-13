import { redirect } from '@sveltejs/kit';
import { authedRunner, runner } from '$lib/server/runner';
import { Effect } from 'effect';
import { AuthService } from '$lib/services/auth';

export const load = async (event) => {
	const channels = await authedRunner(event, ({ db }) => db.getChannelsWithStats());
	return { channels };
};

export const actions = {
	signout: async (event) => {
		await runner(
			Effect.gen(function* () {
				const auth = yield* AuthService;
				return yield* auth.signOut(event);
			})
		);
		redirect(302, '/');
	}
};
