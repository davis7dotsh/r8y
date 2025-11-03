<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { toggleMode } from 'mode-watcher';
	import { mode } from 'mode-watcher';
	import { Moon, Sun } from '@lucide/svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { setAppStore } from './AppStore.svelte';
	import { getAuthStore } from '$lib/auth/AuthStore.svelte';

	const appStore = setAppStore();
	const authStore = getAuthStore();

	const { children } = $props();
</script>

<div class="flex h-screen w-full">
	<aside class="flex w-64 flex-col border-r border-sidebar-border bg-sidebar p-4">
		<nav class="flex flex-col gap-2">
			<Button href="/app" variant="ghost" class="justify-start">Home</Button>
		</nav>
		<div class="mt-auto flex flex-col gap-2">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button {...props} variant="outline" class="w-full justify-start">
							{appStore.selectedChannelName ?? 'No channels found...'}
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					{#each appStore.channels as channel}
						<DropdownMenu.Item onclick={() => (appStore.selectedChannelId = channel.ytChannelId)}>
							{channel.name}
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
			<div class="flex gap-2">
				<Button onclick={toggleMode} variant="outline" size="icon" class="flex-1">
					{#if mode.current === 'dark'}
						<Sun />
					{:else}
						<Moon />
					{/if}
				</Button>
				<Button onclick={authStore.handleSignOut} class="flex-1">Sign Out</Button>
			</div>
		</div>
	</aside>

	<main class="flex grow flex-col items-center justify-center gap-4">
		{@render children()}
	</main>
</div>
