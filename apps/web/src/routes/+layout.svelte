<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { setAuthStore } from '$lib/stores/AuthStore.svelte';
	import { ModeWatcher } from 'mode-watcher';

	setAuthStore();

	let { children } = $props();
</script>

<svelte:head>
	<title>My SvelteKit App</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<!-- <div class="flex flex-col items-center justify-between" data-sveltekit-preload-data="off"> -->
<div class="flex flex-col items-center justify-between">
	{@render children?.()}
</div>
