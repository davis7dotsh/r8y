<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import ChannelLastSevenVids from '$lib/components/ChannelLastSevenVids.svelte';
	import ChannelHeader from '$lib/components/ChannelHeader.svelte';
	import ChannelVideos from '$lib/components/ChannelVideos.svelte';
	import ChannelNotifications from '$lib/components/ChannelNotifications.svelte';
	import ChannelSponsorsTable from '$lib/components/ChannelSponsorsTable.svelte';

	let { data } = $props();

	const channelId = $derived(data.channelId);
	const channel = $derived(data.channel);

	let tab = $state<'details' | 'recent' | 'sponsors'>('details');
</script>

<svelte:head>
	<title>{channel?.name} - r8y 3.0</title>
	<meta
		name="description"
		content="View detailed analytics, recent videos, sponsors, and notifications for {channel?.name}."
	/>
</svelte:head>

<div class="flex flex-col gap-6 p-8">
	<ChannelHeader {channelId} channels={data.allChannels} />

	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
				<Tabs.Trigger value="details" onclick={() => (tab = 'details')}>Overview</Tabs.Trigger>
				<Tabs.Trigger value="recent" onclick={() => (tab = 'recent')}>Last 7 Days</Tabs.Trigger>
				<Tabs.Trigger value="sponsors" onclick={() => (tab = 'sponsors')}>Sponsors</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
	</div>

	{#if tab === 'details'}
		<div class="space-y-6">
			<ChannelVideos {channelId} videos={data.videos} />
			<ChannelNotifications notifications={data.notifications} />
		</div>
	{:else if tab === 'recent'}
		<ChannelLastSevenVids {channelId} fullData={data.last7Videos} />
	{:else if tab === 'sponsors'}
		<ChannelSponsorsTable {channelId} sponsors={data.sponsors} />
	{/if}
</div>
