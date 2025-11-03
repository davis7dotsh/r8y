import { goto } from '$app/navigation';
import { remoteGetAllChannels } from '$lib/remote/channels.remote';
import { createContext, onMount } from 'svelte';

type Channel = Awaited<ReturnType<typeof remoteGetAllChannels>>[number];

class AppStore {
	channels = $state<Channel[]>([]);

	selectedChannelId = $state<string>('');

	selectedChannelName = $derived.by(() => {
		return (
			this.channels.find((channel) => channel.ytChannelId === this.selectedChannelId)?.name ?? null
		);
	});

	refreshChannels = async () => {
		const channels = await remoteGetAllChannels();
		this.channels = channels;
		return channels;
	};

	constructor() {
		onMount(async () => {
			const channels = await this.refreshChannels();

			if (channels.length > 0 && this.selectedChannelId === '') {
				this.selectedChannelId = channels[0].ytChannelId;
			}

			if (channels.length === 0) {
				goto('/app/channels/create');
			}
		});
	}
}

const [internalGetStore, internalSetStore] = createContext<AppStore>();

export const getAppStore = () => {
	const store = internalGetStore();
	if (!store) {
		throw new Error('AppStore not found');
	}
	return store;
};

export const setAppStore = () => internalSetStore(new AppStore());
