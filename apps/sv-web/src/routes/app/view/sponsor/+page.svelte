<script lang="ts">
	import { remoteGetSponsorDetails, remoteGetChannelDetails } from '$lib/remote/channels.remote';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import SponsorStats from '$lib/components/SponsorStats.svelte';
	import SponsorVideosTable from '$lib/components/SponsorVideosTable.svelte';
	import SponsorMentionsTable from '$lib/components/SponsorMentionsTable.svelte';
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

	$inspect(sponsor);
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
					<Breadcrumb.Link href="/app/view/channel?channelId={channelId}"
						>{channel.name}</Breadcrumb.Link
					>
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
			<a
				class="mt-2 text-sm text-muted-foreground"
				href={sponsor.sponsor.sponsorKey}
				target="_blank"
			>
				{sponsor.sponsor.sponsorKey}
			</a>
		</div>
	</div>

	<SponsorStats sponsorData={sponsor} />
	<div class="space-y-8">
		<SponsorVideosTable sponsorData={sponsor} {channelId} />
		<SponsorMentionsTable sponsorData={sponsor} {channelId} />
	</div>
</div>
