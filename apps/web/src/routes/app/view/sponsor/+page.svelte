<script lang="ts">
	import AppBreadcrumb from '$lib/components/AppBreadcrumb.svelte';
	import SponsorStats from '$lib/components/SponsorStats.svelte';
	import SponsorVideosTable from '$lib/components/SponsorVideosTable.svelte';
	import SponsorMentionsTable from '$lib/components/SponsorMentionsTable.svelte';
	import { ExternalLink } from '@lucide/svelte';
	import z from 'zod';
	import { useSearchParams } from 'runed/kit';
	import { remoteGetSponsorDetails } from '$lib/remote/channels.remote';

	const paramsSchema = z.object({
		sponsorId: z.string().default(''),
		channelId: z.string().default('')
	});

	const searchParams = useSearchParams(paramsSchema);

	const channelId = $derived(searchParams.channelId);
	const sponsorId = $derived(searchParams.sponsorId);
</script>

<svelte:head>
	<title>Sponsor - r8y 3.0</title>
	<meta name="description" content="Track sponsor mentions, videos, and performance metrics." />
</svelte:head>

<div class="flex flex-col gap-6 p-8">
	{#if !channelId || !sponsorId}
		<p class="text-muted-foreground">Please select a sponsor</p>
	{:else}
		<svelte:boundary>
			{#snippet pending()}
				<div>loading sponsor...</div>
			{/snippet}

			{#snippet failed(e, r)}
				<div>error loading sponsor: {(e as Error).message}</div>
			{/snippet}

			{@const sponsor = await remoteGetSponsorDetails(sponsorId)}

			<AppBreadcrumb
				items={[
					{ type: 'channel', channelId, isLink: true },
					{ type: 'page', label: sponsor.sponsor.name }
				]}
			/>

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
		</svelte:boundary>
	{/if}
</div>
