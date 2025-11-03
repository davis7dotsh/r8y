<script lang="ts">
	import {
		remoteGetChannelsWithStats,
		remoteGetLast7VideosByViews
	} from '$lib/remote/channels.remote';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { ChevronDown } from '@lucide/svelte';

	const channels = await remoteGetChannelsWithStats();

	let selectedChannelId = $state<string | null>(null);

	$effect(() => {
		if (channels && channels.length > 0 && !selectedChannelId) {
			selectedChannelId = channels[0].ytChannelId;
		}
	});

	const videosPromise = $derived(
		selectedChannelId ? remoteGetLast7VideosByViews(selectedChannelId) : null
	);

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

	const formatDaysAgo = (date: Date) => {
		const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
		if (days === 0) return 'Today';
		if (days === 1) return '1 day ago';
		return `${days} days ago`;
	};

	const todayDate = $derived(
		new Date().toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	);

	const selectedChannel = $derived.by(() => {
		if (!selectedChannelId || !channels) return null;
		return channels.find((c) => c.ytChannelId === selectedChannelId) ?? null;
	});
</script>

<div class="p-8">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-foreground">Last 7 Videos</h1>
			<p class="mt-2 text-sm text-muted-foreground">
				View the most recent videos ranked by view count
			</p>
		</div>
		<div class="text-sm text-muted-foreground">{todayDate}</div>
	</div>

	{#if !channels || channels.length === 0}
		<div class="flex items-center justify-center rounded-lg border border-border bg-muted p-8">
			<p class="text-muted-foreground">No channels found. Add a channel to get started.</p>
		</div>
	{:else if !selectedChannelId}
		<div class="flex items-center justify-center rounded-lg border border-border bg-muted p-8">
			<p class="text-muted-foreground">Select a channel to view videos</p>
		</div>
	{:else if videosPromise}
		{#await videosPromise}
			<div class="flex items-center justify-center rounded-lg border border-border bg-muted p-8">
				<Spinner class="size-6 text-muted-foreground" />
			</div>
		{:then videosResult}
			<div class="space-y-6">
				<div class="flex items-center justify-between rounded-lg border border-border bg-card p-6">
					<div>
						<h2 class="text-2xl font-semibold text-card-foreground">
							{videosResult.channel.name}
						</h2>
						<p class="mt-1 text-sm text-muted-foreground">
							Total views on last 7 videos: {formatNumber(videosResult.totalViews)}
						</p>
					</div>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
						>
							{selectedChannel?.name ?? 'Select Channel'}
							<ChevronDown class="h-4 w-4" />
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="min-w-[200px]">
							{#each channels as channel}
								<DropdownMenu.Item
									onclick={() => {
										selectedChannelId = channel.ytChannelId;
									}}
									class={selectedChannelId === channel.ytChannelId ? 'bg-accent' : ''}
								>
									{channel.name}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>

				{#if videosResult.videos.length === 0}
					<div
						class="flex items-center justify-center rounded-lg border border-border bg-muted p-8"
					>
						<p class="text-muted-foreground">No videos published in the last 7 days</p>
					</div>
				{:else}
					<div class="overflow-hidden rounded-lg border border-border bg-card">
						<table class="w-full">
							<thead>
								<tr class="border-b border-border">
									<th class="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
										Thumbnail
									</th>
									<th class="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
										Title
									</th>
									<th class="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
										Views
									</th>
									<th class="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
										Sponsor
									</th>
									<th class="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
										Days Ago
									</th>
									<th class="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
										Publish Date
									</th>
								</tr>
							</thead>
							<tbody>
								{#each videosResult.videos as video}
									<tr class="border-b border-border last:border-0 hover:bg-accent">
										<td class="px-6 py-4">
											<a href="/app/channels/{selectedChannelId}/videos/{video.ytVideoId}">
												<img
													src={video.thumbnailUrl}
													alt={video.title}
													class="h-16 w-28 rounded object-cover"
												/>
											</a>
										</td>
										<td class="px-6 py-4 text-sm text-card-foreground">
											<a
												href="/app/channels/{selectedChannelId}/videos/{video.ytVideoId}"
												class="text-primary hover:underline"
											>
												{video.title}
											</a>
										</td>
										<td class="px-6 py-4 text-sm text-card-foreground">
											{formatNumber(video.viewCount)}
										</td>
										<td class="px-6 py-4 text-sm text-card-foreground">
											{#if video.sponsor}
												<a
													href="/app/channels/{selectedChannelId}/sponsors/{video.sponsor
														.sponsorId}"
													class="inline-flex items-center rounded-full px-3 py-1 font-medium text-primary ring-2 ring-primary transition-colors hover:bg-primary hover:text-primary-foreground"
												>
													{video.sponsor.name}
												</a>
											{:else}
												-
											{/if}
										</td>
										<td class="px-6 py-4 text-sm text-card-foreground">
											{formatDaysAgo(video.publishedAt)}
										</td>
										<td class="px-6 py-4 text-sm text-card-foreground">
											{formatDate(video.publishedAt)}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		{:catch err}
			<div class="flex items-center justify-center rounded-lg border border-border bg-muted p-8">
				<p class="text-destructive">Failed to load videos</p>
			</div>
		{/await}
	{/if}
</div>
