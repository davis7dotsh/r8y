<script lang="ts">
	import { goto } from '$app/navigation';
	import { getAuthStore } from '$lib/auth/AuthStore.svelte.js';
	import RootLoader from '$lib/components/RootLoader.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	const authStore = getAuthStore();

	let authPassword = $state('');

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault();
		const result = await authStore.handleSignIn(authPassword);
		if (!result) {
			alert('Failed to sign in');
			return;
		}
		goto('/app');
	};
</script>

{#if authStore.isLoading}
	<RootLoader />
{:else if authStore.isAuthenticated}
	<main class="flex grow flex-col items-center justify-center gap-4">
		<Button href="/app">Go to app</Button>
	</main>
{:else}
	<form class="flex grow flex-col items-start justify-center gap-4" onsubmit={handleSubmit}>
		<h2 class="text-2xl font-bold">r8y 3.0</h2>
		<div class="flex w-full max-w-sm flex-col gap-1.5">
			<Label for="password">Password</Label>
			<Input type="password" id="password" placeholder="password" bind:value={authPassword} />
		</div>
		<Button type="submit">Sign in</Button>
	</form>
{/if}
