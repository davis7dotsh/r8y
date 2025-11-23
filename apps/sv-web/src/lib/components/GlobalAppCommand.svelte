<script lang="ts">
	import * as Command from '$lib/components/ui/command/index.js';
	import z from 'zod';
	import Button from './ui/button/button.svelte';
	import { useSearchParams } from 'runed/kit';
	import { remoteSearchVideosAndSponsors } from '$lib/remote/channels.remote';

	let open = $state(false);
	let value = $state('');

	const searchParamsSchema = z.object({
		channelId: z.string().default('')
	});

	const params = useSearchParams(searchParamsSchema);

	const channelId = $derived(params.channelId);

	const searchResults = $derived(
		await remoteSearchVideosAndSponsors({
			channelId: channelId,
			searchQuery: value
		})
	);
	const videoResults = $derived(searchResults.videos);
	const sponsorResults = $derived(searchResults.sponsors);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			open = !open;
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<Button onclick={() => (open = !open)} size="sm" variant="ghost"
	>Search
	<kbd
		class="pointer-events-none inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 select-none"
	>
		<span class="text-md">⌘</span>k
	</kbd>
</Button>

{#snippet SearchResults()}
	{#if videoResults.length > 0}
		<Command.Group heading="Videos">
			{#each videoResults as video}
				<Command.LinkItem href="/app/view/video?channelId={channelId}&videoId={video.ytVideoId}">
					{video.title}
				</Command.LinkItem>
			{/each}
		</Command.Group>
	{/if}
	{#if sponsorResults.length > 0}
		<Command.Group heading="Sponsors">
			{#each sponsorResults as sponsor}
				<Command.LinkItem
					href="/app/view/sponsor?channelId={channelId}&sponsorId={sponsor.sponsorId}"
				>
					{sponsor.name}
				</Command.LinkItem>
			{/each}
		</Command.Group>
	{/if}
{/snippet}

<Command.Dialog bind:open>
	<Command.Input placeholder="Search for a video or sponsor..." bind:value />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>

		{@render SearchResults()}
	</Command.List>
</Command.Dialog>
