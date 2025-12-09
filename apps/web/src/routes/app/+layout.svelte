<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { toggleMode } from 'mode-watcher';
	import { mode } from 'mode-watcher';
	import { Moon, Sun } from '@lucide/svelte';
	import { getAuthStore } from '$lib/stores/AuthStore.svelte';
	import RootLoader from '$lib/components/RootLoader.svelte';
	import AppError from '$lib/components/AppError.svelte';
	import GlobalAppCommand from '$lib/components/GlobalAppCommand.svelte';

	const { children } = $props();

	const authStore = getAuthStore();
</script>

<div class="flex min-h-screen w-full flex-col">
	{#if authStore.isAuthenticated}
		<nav
			class="sticky top-0 z-50 flex items-center justify-between border-b border-sidebar-border bg-sidebar/95 px-4 py-1.5 backdrop-blur-sm"
		>
			<Button href="/app" variant="ghost">All Channels</Button>
			<div class="flex flex-row items-center justify-end gap-2">
				<svelte:boundary>
					{#snippet pending()}
						<div></div>
					{/snippet}
					<GlobalAppCommand />
				</svelte:boundary>
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
			class="sticky top-0 z-50 flex items-center justify-between border-b border-sidebar-border bg-sidebar/95 px-4 py-1.5 backdrop-blur-sm"
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

	<main class="mx-auto w-full max-w-7xl flex-1">
		<svelte:boundary>
			{#snippet pending()}
				<RootLoader />
			{/snippet}
			{#snippet failed(err, retryFn)}
				<AppError {err} {retryFn} />
			{/snippet}
			{@render children()}
		</svelte:boundary>
	</main>
</div>
