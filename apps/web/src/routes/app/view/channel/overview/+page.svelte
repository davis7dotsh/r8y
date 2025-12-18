<script lang="ts">
	import ChannelVideos from '$lib/components/ChannelVideos.svelte';
	import ChannelSponsorMentions from '$lib/components/ChannelSponsorMentions.svelte';
	import ChannelNotifications from '$lib/components/ChannelNotifications.svelte';
	import z from 'zod';
	import { useSearchParams } from 'runed/kit';

	const paramsSchema = z.object({
		channelId: z.string().default('')
	});

	const searchParams = useSearchParams(paramsSchema);
	const channelId = $derived(searchParams.channelId);
</script>

{#if channelId}
	<div class="space-y-6">
		<svelte:boundary>
			{#snippet pending()}
				<div>loading videos...</div>
			{/snippet}
			{#snippet failed(e)}
				<div>error loading videos: {(e as Error).message}</div>
			{/snippet}
			<ChannelVideos {channelId} />
		</svelte:boundary>

		<svelte:boundary>
			{#snippet pending()}
				<div>loading sponsor mentions...</div>
			{/snippet}
			{#snippet failed(e)}
				<div>error loading sponsor mentions: {(e as Error).message}</div>
			{/snippet}
			<ChannelSponsorMentions {channelId} />
		</svelte:boundary>

		<svelte:boundary>
			{#snippet pending()}
				<div>loading notifications...</div>
			{/snippet}
			{#snippet failed(e)}
				<div>error loading notifications: {(e as Error).message}</div>
			{/snippet}
			<ChannelNotifications {channelId} />
		</svelte:boundary>
	</div>
{/if}

