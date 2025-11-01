import { query } from '$app/server';

export const remoteDemo = query(async () => {
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
