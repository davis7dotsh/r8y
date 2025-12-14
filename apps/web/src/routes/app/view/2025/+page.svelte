<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import SponsorTable from './SponsorTable.svelte';
	import VideoTable from './VideoTable.svelte';

	let { data } = $props();

	const channelId = $derived(data.channelId);
	const channel = $derived(data.channel);
</script>

<svelte:head>
	<title>2025 Analytics{channel ? ` - ${channel.name}` : ''} - r8y 3.0</title>
	<meta name="description" content="View 2025 analytics for sponsors and videos." />
</svelte:head>

<div class="flex flex-col gap-6 p-8">
	{#if !channelId}
		<p class="text-muted-foreground">Please select a channel</p>
	{:else}
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<Breadcrumb.Root>
				<Breadcrumb.List>
					<Breadcrumb.Item>
						<Breadcrumb.Link href="/app">Channels</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator />
					<Breadcrumb.Item>
						<Breadcrumb.Link href={`/app/view/channel?channelId=${channelId}`}>
							{channel?.name ?? 'Channel'}
						</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator />
					<Breadcrumb.Item>
						<Breadcrumb.Page>2025 Analytics</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</div>

		<!-- Sponsors Section -->
		<svelte:boundary>
			{#snippet pending()}
				<div>loading sponsors...</div>
			{/snippet}

			{#snippet failed(e, r)}
				<div>error loading sponsors: {(e as Error).message}</div>
			{/snippet}

			<SponsorTable {channelId} />
		</svelte:boundary>

		<!-- Videos Section -->
		<svelte:boundary>
			{#snippet pending()}
				<div>loading videos...</div>
			{/snippet}

			{#snippet failed(e, r)}
				<div>error loading videos: {(e as Error).message}</div>
			{/snippet}

			<VideoTable {channelId} />
		</svelte:boundary>
	{/if}
</div>
