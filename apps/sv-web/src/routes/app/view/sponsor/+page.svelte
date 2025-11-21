<script lang="ts">
	import { remoteGetSponsorDetails, remoteGetChannelDetails } from '$lib/remote/channels.remote';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import SponsorStats from '$lib/components/SponsorStats.svelte';
	import SponsorVideosTable from '$lib/components/SponsorVideosTable.svelte';
	import ChannelHeader from '$lib/components/ChannelHeader.svelte';
	import z from 'zod';
	import { useSearchParams } from 'runed/kit';

	const sponsorParamsSchema = z.object({
		channelId: z.string().default(''),
		sponsorId: z.string().default('')
	});

	const params = useSearchParams(sponsorParamsSchema);

	const sponsorId = $derived(params.sponsorId);
	const channelId = $derived(params.channelId);

	const sponsor = $derived(await remoteGetSponsorDetails(sponsorId));
	const channel = $derived(await remoteGetChannelDetails(channelId));
</script>

<div class="flex flex-col gap-4 p-8">
	<ChannelHeader {channelId} />
	<div class="mb-6">
		<Breadcrumb.Root>
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/app">Channels</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/app/view/channel?channelId={channelId}">{channel.name}</Breadcrumb.Link>
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
