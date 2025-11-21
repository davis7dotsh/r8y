<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { remoteGetChannelDetails } from '$lib/remote/channels.remote';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import ChannelFullDetails from '$lib/components/ChannelFullDetails.svelte';
	import ChannelLastSevenVids from '$lib/components/ChannelLastSevenVids.svelte';
	import ChannelAllSponsors from '$lib/components/ChannelAllSponsors.svelte';
	import ChannelHeader from '$lib/components/ChannelHeader.svelte';

	const { channelId }: { channelId: string } = $props();

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
		<ChannelFullDetails {channelId} />
	{:else if tab === 'recent'}
		<ChannelLastSevenVids {channelId} />
	{:else if tab === 'sponsors'}
		<ChannelAllSponsors {channelId} />
	{/if}
</div>
