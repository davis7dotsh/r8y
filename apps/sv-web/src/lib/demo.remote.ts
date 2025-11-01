import { query } from '$app/server';

export const remoteDemo = query(async () => {
	await new Promise((resolve) => setTimeout(resolve, 1000));
	return {
		channels: [
			{
				name: 'Channel 1'
			},
			{
				name: 'Channel 2'
			},
			{
				name: 'Channel 3'
			}
		]
	};
});
