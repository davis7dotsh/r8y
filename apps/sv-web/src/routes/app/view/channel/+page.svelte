<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { remoteGetChannelDetails } from '$lib/remote/channels.remote';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import ChannelLastSevenVids from '$lib/components/ChannelLastSevenVids.svelte';
	import ChannelHeader from '$lib/components/ChannelHeader.svelte';
	import { useSearchParams } from 'runed/kit';
	import z from 'zod';
	import ChannelVideos from '$lib/components/ChannelVideos.svelte';
	import ChannelNotifications from '$lib/components/ChannelNotifications.svelte';
	import ChannelSponsorsTable from '$lib/components/ChannelSponsorsTable.svelte';

	const viewParamsSchema = z.object({
		channelId: z.string().default('')
	});

	const params = useSearchParams(viewParamsSchema);

	const channelId = $derived(params.channelId);

	const channel = $derived(await remoteGetChannelDetails(channelId));

	let tab = $state<'details' | 'recent' | 'sponsors'>('details');
</script>

<svelte:head>
	<title>{channel?.name}</title>
</svelte:head>

<div class="flex flex-col gap-4 p-8">
	<ChannelHeader {channelId} />
	<div class="mb-6 flex w-full items-center justify-between">
		<Breadcrumb.Root>
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/app">Channels</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>{channel.name}</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>

		<Tabs.Root value={'details'}>
			<Tabs.List>
				<Tabs.Trigger value="details" onclick={() => (tab = 'details')}>Details</Tabs.Trigger>
				<Tabs.Trigger value="recent" onclick={() => (tab = 'recent')}>Recent Videos</Tabs.Trigger>
				<Tabs.Trigger value="sponsors" onclick={() => (tab = 'sponsors')}>Sponsors</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
	</div>
	{#if tab === 'details'}
		<svelte:boundary>
			{#snippet pending()}
				<div></div>
			{/snippet}
			<div class="flex flex-col gap-8">
				<ChannelVideos {channelId} />
				<ChannelNotifications {channelId} />
			</div>
		</svelte:boundary>
	{:else if tab === 'recent'}
		<svelte:boundary>
			{#snippet pending()}
				<div></div>
			{/snippet}
			<ChannelLastSevenVids {channelId} />
		</svelte:boundary>
	{:else if tab === 'sponsors'}
		<svelte:boundary>
			{#snippet pending()}
				<div></div>
			{/snippet}
			<ChannelSponsorsTable {channelId} />
		</svelte:boundary>
	{/if}
</div>
