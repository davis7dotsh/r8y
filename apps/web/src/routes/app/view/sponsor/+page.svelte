<script lang="ts">
	import { remoteGetSponsorDetails, remoteGetChannelDetails } from '$lib/remote/channels.remote';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import SponsorStats from '$lib/components/SponsorStats.svelte';
	import SponsorVideosTable from '$lib/components/SponsorVideosTable.svelte';
	import SponsorMentionsTable from '$lib/components/SponsorMentionsTable.svelte';
	import ChannelHeader from '$lib/components/ChannelHeader.svelte';
	import z from 'zod';
	import { useSearchParams } from 'runed/kit';
	import { ExternalLink } from '@lucide/svelte';

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

<svelte:head>
	<title>{sponsor.sponsor.name} - {channel.name} - r8y 3.0</title>
	<meta
		name="description"
		content="Track sponsor mentions, videos, and performance metrics for {sponsor.sponsor
			.name} on {channel.name}."
	/>
</svelte:head>

<div class="flex flex-col gap-6 p-8">
	<ChannelHeader {channelId} />

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

	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold text-foreground">{sponsor.sponsor.name}</h1>
			<a
				class="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
				href={sponsor.sponsor.sponsorKey}
				target="_blank"
				rel="noopener noreferrer"
			>
				{sponsor.sponsor.sponsorKey}
				<ExternalLink class="h-3.5 w-3.5" />
			</a>
		</div>
	</div>

	<SponsorStats sponsorData={sponsor} />

	<div class="space-y-6">
		<SponsorVideosTable sponsorData={sponsor} {channelId} />
		<SponsorMentionsTable sponsorData={sponsor} {channelId} />
	</div>
</div>
