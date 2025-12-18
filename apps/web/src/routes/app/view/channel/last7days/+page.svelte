<script lang="ts">
	import ChannelLastSevenVids from '$lib/components/ChannelLastSevenVids.svelte';
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
			<div>loading videos...</div>
		{/snippet}
		{#snippet failed(e)}
			<div>error loading videos: {(e as Error).message}</div>
		{/snippet}
		<ChannelLastSevenVids {channelId} />
	</svelte:boundary>
{/if}

