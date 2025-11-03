<script lang="ts">
	import { remoteGetSponsorDetails, remoteGetChannelDetails } from '$lib/remote/channels.remote';
	import { page } from '$app/state';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';

	const channelId = $derived(page.params.channelId as string);
	const sponsorId = $derived(page.params.sponsorId as string);

	const sponsorPromise = $derived(remoteGetSponsorDetails(sponsorId));
	const channelPromise = $derived(remoteGetChannelDetails(channelId));

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
					{#await sponsorPromise}
						<Breadcrumb.Page>Loading...</Breadcrumb.Page>
					{:then sponsorData}
						<Breadcrumb.Page>{sponsorData.sponsor.name}</Breadcrumb.Page>
					{:catch}
						<Breadcrumb.Page>Sponsor Not Found</Breadcrumb.Page>
					{/await}
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>
	<div class="mb-8 flex items-center justify-between">
		<div>
			{#await sponsorPromise}
				<div class="flex items-center gap-2">
					<Spinner class="size-6 text-muted-foreground" />
					<h1 class="text-3xl font-bold text-foreground">Loading...</h1>
				</div>
			{:then sponsorData}
				<h1 class="text-3xl font-bold text-foreground">{sponsorData.sponsor.name}</h1>
				<p class="mt-2 text-sm text-muted-foreground">
					Sponsor Key: {sponsorData.sponsor.sponsorKey}
				</p>
			{:catch}
				<h1 class="text-3xl font-bold text-foreground">Sponsor Not Found</h1>
			{/await}
		</div>
	</div>

	{#await sponsorPromise}
		<div class="flex items-center justify-center rounded-lg border border-border bg-muted p-8">
			<Spinner class="size-6 text-muted-foreground" />
		</div>
	{:then sponsorData}
		<div class="space-y-8">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div class="rounded-lg border border-border bg-card p-6">
					<h3 class="text-sm font-medium text-muted-foreground">Total Views</h3>
					<p class="mt-2 text-3xl font-bold text-card-foreground">
						{formatNumber(sponsorData.stats.totalViews)}
					</p>
				</div>
				<div class="rounded-lg border border-border bg-card p-6">
					<h3 class="text-sm font-medium text-muted-foreground">Total Ads</h3>
					<p class="mt-2 text-3xl font-bold text-card-foreground">
						{sponsorData.stats.totalAds}
					</p>
				</div>
				<div class="rounded-lg border border-border bg-card p-6">
					<h3 class="text-sm font-medium text-muted-foreground">Last Publish Date</h3>
					<p class="mt-2 text-3xl font-bold text-card-foreground">
						{#if sponsorData.stats.lastPublishDate}
							{formatDate(new Date(sponsorData.stats.lastPublishDate))}
						{:else}
							—
						{/if}
					</p>
				</div>
			</div>

			<div>
				<h2 class="mb-4 text-xl font-semibold text-foreground">Videos</h2>
				{#if !sponsorData.videos || sponsorData.videos.length === 0}
					<div class="rounded-lg border border-border bg-muted p-8">
						<p class="text-center text-muted-foreground">No videos found</p>
					</div>
				{:else}
					<div class="overflow-hidden rounded-lg border border-border bg-card">
						<table class="w-full">
							<thead class="border-b border-border bg-muted">
								<tr>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
									>
										Thumbnail
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
									>
										Title
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
									>
										Views
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
									>
										Likes
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
									>
										Published
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								{#each sponsorData.videos as video}
									<tr class="hover:bg-muted/50">
										<td class="px-6 py-4">
											<a href="/app/channels/{channelId}/videos/{video.ytVideoId}">
												<img
													src={video.thumbnailUrl}
													alt={video.title}
													class="h-12 w-20 rounded object-cover transition-opacity hover:opacity-80"
												/>
											</a>
										</td>
										<td class="px-6 py-4">
											<a
												href="/app/channels/{channelId}/videos/{video.ytVideoId}"
												class="max-w-md truncate text-sm font-medium text-card-foreground transition-colors hover:text-primary"
											>
												{video.title}
											</a>
										</td>
										<td class="px-6 py-4 text-sm text-muted-foreground">
											{formatNumber(video.viewCount)}
										</td>
										<td class="px-6 py-4 text-sm text-muted-foreground">
											{formatNumber(video.likeCount)}
										</td>
										<td class="px-6 py-4 text-sm text-muted-foreground">
											{formatDate(video.publishedAt)}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>
	{:catch}
		<div class="flex items-center justify-center rounded-lg border border-border bg-muted p-8">
			<div class="text-center">
				<p class="text-muted-foreground">Sponsor not found</p>
				<a
					href="/app/channels/{channelId}"
					class="mt-2 text-sm text-muted-foreground hover:text-foreground">Return to channel</a
				>
			</div>
		</div>
	{/await}
</div>
