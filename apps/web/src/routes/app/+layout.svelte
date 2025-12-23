<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { toggleMode } from 'mode-watcher';
	import { mode } from 'mode-watcher';
	import { Moon, Sun } from '@lucide/svelte';
	import GlobalAppCommand from '$lib/components/GlobalAppCommand.svelte';
	import { getAuthStore } from '$lib/stores/AuthStore.svelte';

	const { children } = $props();

	const authStore = getAuthStore();
</script>

{#if !authStore.isAuthenticated}
	<div class="flex min-h-screen w-full flex-col">
		<div class="flex flex-col items-center justify-center">
			<h1 class="text-2xl font-bold">Not Authenticated</h1>
			<Button href="/" size="sm">Sign In</Button>
		</div>
	</div>
{:else}
	<div class="flex min-h-screen w-full flex-col">
		<nav
			class="border-sidebar-border bg-sidebar/95 sticky top-0 z-50 flex items-center justify-between border-b px-4 py-1.5 backdrop-blur-sm"
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
				<Button onclick={() => authStore.signOut()} size="sm">Sign Out</Button>
			</div>
		</nav>

		<main class="mx-auto w-full max-w-7xl flex-1">
			{@render children()}
		</main>
	</div>
{/if}
