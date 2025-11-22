<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { toggleMode } from 'mode-watcher';
	import { mode } from 'mode-watcher';
	import { Moon, Sun } from '@lucide/svelte';
	import { getAuthStore } from '$lib/stores/AuthStore.svelte';
	import RootLoader from '$lib/components/RootLoader.svelte';
	import AppError from '$lib/components/AppError.svelte';

	const { children } = $props();

	const authStore = getAuthStore();
</script>

<div class="flex h-screen w-full flex-col">
	{#if authStore.isAuthenticated}
		<nav
			class="flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-1.5"
		>
			<Button href="/app" variant="ghost">All Channels</Button>
			<div class="flex gap-2">
				<Button onclick={toggleMode} variant="outline" size="icon-sm">
					{#if mode.current === 'dark'}
						<Sun />
					{:else}
						<Moon />
					{/if}
				</Button>
				<Button onclick={authStore.handleSignOut} size="sm">Sign Out</Button>
			</div>
		</nav>
	{:else}
		<nav
			class="flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-1.5"
		>
			<Button href="/app" variant="ghost">Home</Button>
			<div class="flex gap-2">
				<Button onclick={toggleMode} variant="outline" size="icon-sm">
					{#if mode.current === 'dark'}
						<Sun />
					{:else}
						<Moon />
					{/if}
				</Button>
			</div>
		</nav>
	{/if}

	<svelte:boundary>
		{#snippet pending()}
			<RootLoader />
		{/snippet}
		{#snippet failed(err, retryFn)}
			<AppError {err} {retryFn} />
		{/snippet}
		<main class="h-full w-full overflow-auto">
			{@render children()}
		</main>
	</svelte:boundary>
</div>
