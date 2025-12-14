import { remoteGetChannel } from '$lib/remote/channels.remote';
import type { DB_SELECT_MODELS } from '@r8y/db';
import { createContext, onMount } from 'svelte';

class ChannelStore {
	channel = $state<DB_SELECT_MODELS['channels'] | null>(null);
	channelId: string;

	constructor(channelId: string) {
		this.channelId = channelId;
		onMount(async () => {
			const channel = await remoteGetChannel(this.channelId);
			this.channel = channel;
		});
	}
}

const [internalGetChannelStore, internalSetChannelStore] = createContext<ChannelStore>();

export const getChannelStore = () => {
	const store = internalGetChannelStore();
	if (!store) throw new Error('Channel store not found');
	return store;
};

export const setChannelStore = (channelId: string) => {
	const store = new ChannelStore(channelId);
	internalSetChannelStore(store);
};
