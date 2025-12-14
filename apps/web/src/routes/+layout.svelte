<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { setAuthStore } from '$lib/stores/AuthStore.svelte';
	import RootLoader from '$lib/components/RootLoader.svelte';

	const authStore = setAuthStore();

	let { children } = $props();
</script>

<svelte:head>
	<title>r8y - YT Tracking</title>
	<meta
		name="description"
		content="Track YouTube channel analytics, monitor sponsors, and analyze video performance across your channels."
	/>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
{#if authStore.isLoading}
	<RootLoader />
{:else}
	<div class="flex flex-col items-center justify-between">
		{@render children?.()}
	</div>
{/if}
