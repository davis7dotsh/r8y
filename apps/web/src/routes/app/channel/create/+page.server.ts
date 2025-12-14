import { fail, redirect } from '@sveltejs/kit';
import { authedRunner } from '$lib/server/runner';
import { Effect } from 'effect';
import z from 'zod';

const createChannelSchema = z.object({
	channelName: z.string().min(1, 'Channel name is required'),
	ytChannelId: z.string().min(1, 'YouTube Channel ID is required'),
	findSponsorPrompt: z.string()
});

export const actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const data = {
			channelName: formData.get('channelName')?.toString() ?? '',
			ytChannelId: formData.get('ytChannelId')?.toString() ?? '',
			findSponsorPrompt: formData.get('findSponsorPrompt')?.toString() ?? ''
		};

		const parsed = createChannelSchema.safeParse(data);
		if (!parsed.success) {
			return fail(400, {
				error: parsed.error.issues[0]?.message ?? 'Invalid data',
				...data
			});
		}

		await authedRunner(event, ({ db }) =>
			Effect.gen(function* () {
				yield* db.createChannel(parsed.data);
				return { success: true };
			})
		);

		redirect(302, `/app/view/channel?channelId=${parsed.data.ytChannelId}`);
	}
};
