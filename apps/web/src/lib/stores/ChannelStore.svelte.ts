import type { DB_SELECT_MODELS } from '@r8y/db';
import { createContext } from 'svelte';

class ChannelStore {
	private channels = new Map<string, DB_SELECT_MODELS['channels']>();

	constructor() {}
}

const [internalGetChannelStore, internalSetChannelStore] = createContext<ChannelStore>();

export const getChannelStore = () => {
	const store = internalGetChannelStore();
	if (!store) throw new Error('Channel store not found');
	return store;
};

export const setChannelStore = () => {
	const store = new ChannelStore();
	internalSetChannelStore(store);
};
