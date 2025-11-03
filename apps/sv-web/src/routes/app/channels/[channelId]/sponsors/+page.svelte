<script lang="ts">
	import { remoteGetChannelDetails, remoteGetChannelSponsors } from '$lib/remote/channels.remote';
	import { page } from '$app/state';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';

	const channelId = $derived(page.params.channelId as string);

	const channelPromise = $derived(remoteGetChannelDetails(channelId));
	const sponsorsPromise = $derived(remoteGetChannelSponsors(channelId));

	const formatNumber = (num: number) => {
		if (num >= 1000000) {
			return (num / 1000000).toFixed(1) + 'M';
		}
		if (num >= 1000) {
			return (num / 1000).toFixed(1) + 'K';
		}
		return num.toString();
	};

	const formatDate = (date: Date) => {
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};
</script>

<div class="p-8">
	<div class="mb-6">
		<Breadcrumb.Root>
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/app/channels">Channels</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					{#await channelPromise}
						<Breadcrumb.Link href="/app/channels/{channelId}">Loading...</Breadcrumb.Link>
					{:then channel}
						<Breadcrumb.Link href="/app/channels/{channelId}">{channel.name}</Breadcrumb.Link>
					{:catch}
						<Breadcrumb.Link href="/app/channels/{channelId}">Channel</Breadcrumb.Link>
					{/await}
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>Sponsors</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>
	<div class="mb-8 flex items-center justify-between">
		<div>
			{#await channelPromise}
				<div class="flex items-center gap-2">
					<Spinner class="size-6 text-muted-foreground" />
					<h1 class="text-3xl font-bold text-foreground">Loading...</h1>
				</div>
			{:then channel}
				<h1 class="text-3xl font-bold text-foreground">Sponsors</h1>
				<p class="mt-2 text-sm text-muted-foreground">
					Channel: {channel.name}
				</p>
			{:catch}
				<h1 class="text-3xl font-bold text-foreground">Channel Not Found</h1>
			{/await}
		</div>
	</div>

	{#await Promise.all([channelPromise, sponsorsPromise])}
		<div class="flex items-center justify-center rounded-lg border border-border bg-muted p-8">
			<Spinner class="size-6 text-muted-foreground" />
		</div>
	{:then results}
		{@const [channel, sponsors] = results}
		{#if !channel}
			<div class="flex items-center justify-center rounded-lg border border-border bg-muted p-8">
				<div class="text-center">
					<p class="text-muted-foreground">Channel not found</p>
					<a href="/app/channels" class="mt-2 text-sm text-muted-foreground hover:text-foreground"
						>Return to channels</a
					>
				</div>
			</div>
		{:else}
			<div>
				{#if !sponsors || sponsors.length === 0}
					<div class="rounded-lg border border-border bg-muted p-8">
						<p class="text-center text-muted-foreground">No sponsors found</p>
					</div>
				{:else}
					<div class="overflow-hidden rounded-lg border border-border bg-card">
						<table class="w-full">
							<thead class="border-b border-border bg-muted">
								<tr>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
										>Sponsor Name</th
									>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
										>Sponsor Key</th
									>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
										>Total Views</th
									>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
										>Total Videos</th
									>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
										>Last Video Published</th
									>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
										>Days Ago</th
									>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								{#each sponsors as sponsor}
									<tr class="hover:bg-muted/50">
										<td class="px-6 py-4">
											<a
												href="/app/channels/{channelId}/sponsors/{sponsor.sponsorId}"
												class="text-sm font-medium text-card-foreground transition-colors hover:text-primary"
											>
												{sponsor.name}
											</a>
										</td>
										<td class="px-6 py-4 text-sm text-muted-foreground">{sponsor.sponsorKey}</td>
										<td class="px-6 py-4 text-sm text-muted-foreground"
											>{formatNumber(sponsor.totalViews)}</td
										>
										<td class="px-6 py-4 text-sm text-muted-foreground">{sponsor.totalVideos}</td>
										<td class="px-6 py-4 text-sm text-muted-foreground">
											{#if sponsor.lastVideoPublishedAt}
												{formatDate(new Date(sponsor.lastVideoPublishedAt))}
											{:else}
												<span class="text-muted-foreground/50">Never</span>
											{/if}
										</td>
										<td class="px-6 py-4 text-sm text-muted-foreground">
											{#if sponsor.lastVideoPublishedDaysAgo !== null}
												{sponsor.lastVideoPublishedDaysAgo} days
											{:else}
												<span class="text-muted-foreground/50">—</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		{/if}
	{:catch}
		<div
			class="flex items-center justify-center rounded-lg border border-destructive/20 bg-destructive/10 p-8"
		>
			<div class="text-destructive">Error loading sponsors</div>
		</div>
	{/await}
</div>
