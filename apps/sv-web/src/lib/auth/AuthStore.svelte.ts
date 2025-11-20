import { createContext, onMount } from 'svelte';
import { remoteCheckAuth, remoteSignIn, remoteSignOut } from './auth.remote';

class AuthStore {
	isAuthenticated = $state(false);
	isLoading = $state(true);

	constructor() {
		onMount(async () => {
			const result = await remoteCheckAuth();
			console.log('result', result);

			this.isAuthenticated = result.isAuthenticated;
			this.isLoading = false;
		});
	}

	handleSignIn = async (authPassword: string) => {
		this.isLoading = true;
		const result = await remoteSignIn({ authPassword });
		if (result.success) {
			this.isAuthenticated = true;
		}
		this.isLoading = false;
		return result.success;
	};

	handleSignOut = async () => {
		this.isLoading = true;
		const result = await remoteSignOut();
		if (result.success) {
			this.isAuthenticated = false;
		}
		this.isLoading = false;
	};
}

const [internalGetAuthStore, internalSetAuthStore] = createContext<AuthStore>();

const getAuthStore = () => {
	const authStore = internalGetAuthStore();
	if (!authStore) throw new Error('AuthStore not found');
	return authStore;
};

const setAuthStore = () => {
	const authStore = new AuthStore();
	return internalSetAuthStore(authStore);
};

export { getAuthStore, setAuthStore };
