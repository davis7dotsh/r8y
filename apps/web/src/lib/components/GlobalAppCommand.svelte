<script lang="ts">
	import z from 'zod';
	import Button from './ui/button/button.svelte';
	import { useSearchParams } from 'runed/kit';
	import { remoteSearchVideosAndSponsors } from '$lib/remote/channels.remote';
	import * as Command from '$lib/components/ui/command/index.js';

	let open = $state(false);
	let value = $state('');

	const searchParamsSchema = z.object({
		channelId: z.string().default('')
	});

	const params = useSearchParams(searchParamsSchema);

	const channelId = $derived(params.channelId);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			open = !open;
		}
	}

	function closeDialog() {
		open = false;
		value = '';
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<Button onclick={() => (open = !open)} size="sm" variant="ghost"
	>Search
	<kbd
		class="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none"
	>
		<span class="text-md">⌘</span>k
	</kbd>
</Button>

{#snippet Results()}
	{#each await remoteSearchVideosAndSponsors({ channelId: channelId, searchQuery: value }) as item}
		{#if item.type === 'sponsor'}
			<Command.LinkItem
				href="/app/view/sponsor?channelId={channelId}&sponsorId={item.data.sponsorId}"
				onSelect={closeDialog}
			>
				SPONSOR: {item.data.name}
			</Command.LinkItem>
		{:else if item.type === 'channel'}
			<Command.LinkItem
				href="/app/view/channel?channelId={item.data.ytChannelId}"
				onSelect={closeDialog}
			>
				CHANNEL: {item.data.name}
			</Command.LinkItem>
		{:else}
			<Command.LinkItem
				href="/app/view/video?channelId={channelId}&videoId={item.data.ytVideoId}"
				onSelect={closeDialog}
			>
				VIDEO: {item.data.title}
			</Command.LinkItem>
		{/if}
	{/each}
{/snippet}

<Command.Dialog
	bind:open
	shouldFilter={false}
	title={!channelId ? 'Select a channel' : 'Search for videos and sponsors'}
	description={!channelId
		? 'Choose a channel to view'
		: 'Search for a video or sponsor in this channel'}
>
	<Command.Input
		placeholder={!channelId ? 'Select a channel...' : 'Search for a video or sponsor...'}
		bind:value
	/>
	<Command.List>
		{@render Results()}
	</Command.List>
</Command.Dialog>
