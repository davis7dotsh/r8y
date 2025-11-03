<script lang="ts">
	import { goto } from '$app/navigation';
	import AppWrapper from '$lib/app/AppWrapper.svelte';
	import { getAuthStore } from '$lib/auth/AuthStore.svelte';
	import RootLoader from '$lib/components/RootLoader.svelte';

	const authStore = getAuthStore();

	const { children } = $props();

	$effect(() => {
		if (!authStore.isLoading && !authStore.isAuthenticated) {
			goto('/');
		}
	});
</script>

{#if authStore.isLoading}
	<RootLoader />
{:else if authStore.isAuthenticated}
	<AppWrapper>
		{@render children()}
	</AppWrapper>
{:else}
	<p>You are not authenticated</p>
{/if}
