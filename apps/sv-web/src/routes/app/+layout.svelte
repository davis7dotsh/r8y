<script lang="ts">
	import { goto } from '$app/navigation';
	import { getAuthStore } from '$lib/auth/AuthStore.svelte';
	import RootLoader from '$lib/components/RootLoader.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { toggleMode } from 'mode-watcher';
	import { mode } from 'mode-watcher';
	import { Moon, Sun } from '@lucide/svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	const { children } = $props();

	const authStore = getAuthStore();

	const channels = [
		{ id: '1', name: 'General' },
		{ id: '2', name: 'Announcements' },
		{ id: '3', name: 'Random' },
		{ id: '4', name: 'Development' }
	];

	let selectedChannel = $state(channels[0]);

	$effect(() => {
		if (!authStore.isLoading && !authStore.isAuthenticated) {
			goto('/');
		}
	});

	async function handleSignOut() {
		await authStore.handleSignOut();
		goto('/');
	}
</script>

{#if authStore.isLoading}
	<RootLoader />
{:else if authStore.isAuthenticated}
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
								{selectedChannel.name}
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						{#each channels as channel}
							<DropdownMenu.Item onclick={() => (selectedChannel = channel)}>
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
					<Button onclick={handleSignOut} class="flex-1">Sign Out</Button>
				</div>
			</div>
		</aside>
		<main class="flex grow flex-col items-center justify-center gap-4">
			{@render children()}
		</main>
	</div>
{:else}
	<p>You are not authenticated</p>
{/if}
