import { remoteCheckAuth, remoteSignOut } from '$lib/remote/auth.remote';
import { createContext, onMount } from 'svelte';

class AuthStore {
	isAuthenticated = $state(false);
	isLoading = $state(true);

	signOut = async () => {
		this.isLoading = true;
		await remoteSignOut();
		this.isAuthenticated = false;
		this.isLoading = false;
	};

	constructor() {
		onMount(async () => {
			this.isAuthenticated = await remoteCheckAuth();
			this.isLoading = false;
		});
	}
}

const [internalGetStore, internalSetStore] = createContext<AuthStore>();

export const getAuthStore = () => {
	const store = internalGetStore();
	if (!store) throw new Error('AuthStore not found');
	return store;
};

export const setAuthStore = () => internalSetStore(new AuthStore());
