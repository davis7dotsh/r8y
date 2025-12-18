<script lang="ts">
	import ChannelSponsorsTable from '$lib/components/ChannelSponsorsTable.svelte';
	import z from 'zod';
	import { useSearchParams } from 'runed/kit';

	const paramsSchema = z.object({
		channelId: z.string().default('')
	});

	const searchParams = useSearchParams(paramsSchema);
	const channelId = $derived(searchParams.channelId);
</script>

{#if channelId}
	<svelte:boundary>
		{#snippet pending()}
			<div>loading sponsors...</div>
		{/snippet}
		{#snippet failed(e)}
			<div>error loading sponsors: {(e as Error).message}</div>
		{/snippet}
		<ChannelSponsorsTable {channelId} />
	</svelte:boundary>
{/if}

