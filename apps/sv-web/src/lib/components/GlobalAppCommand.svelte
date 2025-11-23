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

	$inspect(searchResults);

	const results = $derived.by(() => {
		if (value.length > 0) {
			return [
				{
					name: 'Sponsor 1',
					url: 'https://example.com/sponsor1'
				},
				{
					name: 'Sponsor 2',
					url: 'https://example.com/sponsor2'
				}
			];
		} else {
			return [];
		}
	});

	$inspect(results);

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
	{#if results.length > 0}
		<Command.Group heading="Sponsors">
			{#each results as sponsor}
				<Command.LinkItem href={sponsor.url}>
					{sponsor.name}
				</Command.LinkItem>
			{/each}
		</Command.Group>
	{/if}
{/snippet}

<Command.Dialog bind:open>
	<Command.Input placeholder="Type a command or search..." bind:value />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>

		{@render SearchResults()}
	</Command.List>
</Command.Dialog>
