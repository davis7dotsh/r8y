<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import AppBreadcrumb from '$lib/components/AppBreadcrumb.svelte';
	import ChannelLastSevenVids from '$lib/components/ChannelLastSevenVids.svelte';
	import ChannelVideos from '$lib/components/ChannelVideos.svelte';
	import ChannelNotifications from '$lib/components/ChannelNotifications.svelte';
	import ChannelSponsorsTable from '$lib/components/ChannelSponsorsTable.svelte';
	import { Button } from '$lib/components/ui/button';
	import z from 'zod';
	import { useSearchParams } from 'runed/kit';

	const paramsSchema = z.object({
		channelId: z.string().default('')
	});

	const searchParams = useSearchParams(paramsSchema);

	const channelId = $derived(searchParams.channelId);

	let tab = $state<'details' | 'recent' | 'sponsors'>('details');
</script>

<svelte:head>
	<title>Channel - r8y 3.0</title>
	<meta
		name="description"
		content="View detailed analytics, recent videos, sponsors, and notifications."
	/>
</svelte:head>

<div class="flex flex-col gap-6 p-8">
	{#if !channelId}
		<p class="text-muted-foreground">Please select a channel</p>
	{:else}
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<AppBreadcrumb items={[{ type: 'channel', channelId }]} />

			<div class="flex items-center gap-4">
				<Tabs.Root value={'details'}>
					<Tabs.List>
						<Tabs.Trigger value="details" onclick={() => (tab = 'details')}>Overview</Tabs.Trigger>
						<Tabs.Trigger value="recent" onclick={() => (tab = 'recent')}>Last 7 Days</Tabs.Trigger>
						<Tabs.Trigger value="sponsors" onclick={() => (tab = 'sponsors')}>Sponsors</Tabs.Trigger>
					</Tabs.List>
				</Tabs.Root>
				<Button href={`/app/view/2025?channelId=${channelId}`} variant="outline">2025 Analytics</Button>
			</div>
		</div>

		{#if tab === 'details'}
			<div class="space-y-6">
				<svelte:boundary>
					{#snippet pending()}
						<div>loading videos...</div>
					{/snippet}
					{#snippet failed(e, r)}
						<div>error loading videos: {(e as Error).message}</div>
					{/snippet}
					<ChannelVideos {channelId} />
				</svelte:boundary>
				<svelte:boundary>
					{#snippet pending()}
						<div>loading notifications...</div>
					{/snippet}
					{#snippet failed(e, r)}
						<div>error loading notifications: {(e as Error).message}</div>
					{/snippet}
					<ChannelNotifications {channelId} />
				</svelte:boundary>
			</div>
		{:else if tab === 'recent'}
			<svelte:boundary>
				{#snippet pending()}
					<div>loading videos...</div>
				{/snippet}
				{#snippet failed(e, r)}
					<div>error loading videos: {(e as Error).message}</div>
				{/snippet}
				<ChannelLastSevenVids {channelId} />
			</svelte:boundary>
		{:else if tab === 'sponsors'}
			<svelte:boundary>
				{#snippet pending()}
					<div>loading sponsors...</div>
				{/snippet}
				{#snippet failed(e, r)}
					<div>error loading sponsors: {(e as Error).message}</div>
				{/snippet}
				<ChannelSponsorsTable {channelId} />
			</svelte:boundary>
		{/if}
	{/if}
</div>
