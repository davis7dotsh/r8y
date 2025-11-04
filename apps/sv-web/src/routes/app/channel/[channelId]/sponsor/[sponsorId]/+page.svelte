<script lang="ts">
	import { remoteGetSponsorDetails, remoteGetChannelDetails } from '$lib/remote/channels.remote';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import SponsorStats from '$lib/components/SponsorStats.svelte';
	import SponsorVideosTable from '$lib/components/SponsorVideosTable.svelte';
	import { page } from '$app/state';
	import ChannelHeader from '$lib/components/ChannelHeader.svelte';

	const sponsorId = $derived(page.params.sponsorId as string);
	const channelId = $derived(page.params.channelId as string);

	const sponsor = $derived(await remoteGetSponsorDetails(sponsorId));
	const channel = $derived(await remoteGetChannelDetails(channelId));
</script>

<div class="flex flex-col gap-4 p-8">
	<ChannelHeader {channelId} />
	<div class="mb-6">
		<Breadcrumb.Root>
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/app/channel/all">Channels</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/app/channel/{channelId}">{channel.name}</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>{sponsor.sponsor.name}</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-foreground">{sponsor.sponsor.name}</h1>
			<p class="mt-2 text-sm text-muted-foreground">
				Sponsor Key: {sponsor.sponsor.sponsorKey}
			</p>
		</div>
	</div>

	<div class="space-y-8">
		<SponsorStats sponsorData={sponsor} />
		<SponsorVideosTable sponsorData={sponsor} {channelId} />
	</div>
</div>
