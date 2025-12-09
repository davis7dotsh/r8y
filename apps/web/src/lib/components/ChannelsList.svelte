<script lang="ts">
	import { remoteGetChannelsWithStats } from '$lib/remote/channels.remote';
	import { formatNumber } from '$lib/utils';
	import { TrendingUp, Video, Eye } from '@lucide/svelte';

	const channels = $derived(await remoteGetChannelsWithStats());
</script>

{#if channels.length === 0}
	<div
		class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-12"
	>
		<div class="rounded-full bg-muted p-4">
			<Video class="h-8 w-8 text-muted-foreground" />
		</div>
		<h3 class="mt-4 text-lg font-medium text-foreground">No channels yet</h3>
		<p class="mt-1 text-sm text-muted-foreground">
			Add a channel to get started tracking your content
		</p>
	</div>
{:else}
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each channels as channel}
			<a
				href="/app/view/channel?channelId={channel.ytChannelId}"
				class="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
			>
				<div class="p-5">
					<div class="flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<h2
								class="truncate text-lg font-semibold text-card-foreground transition-colors group-hover:text-primary"
							>
								{channel.name}
							</h2>
							<p class="mt-0.5 truncate font-mono text-xs text-muted-foreground">
								{channel.ytChannelId}
							</p>
						</div>
					</div>

					<div class="mt-5 grid grid-cols-2 gap-3">
						<div class="rounded-lg bg-muted/50 p-3">
							<div class="flex items-center gap-2 text-muted-foreground">
								<Video class="h-4 w-4" />
								<span class="text-xs font-medium">Videos</span>
							</div>
							<p class="mt-1 text-2xl font-bold text-card-foreground">
								{channel.videoCount}
							</p>
							<p class="text-xs text-muted-foreground">last 30 days</p>
						</div>
						<div class="rounded-lg bg-muted/50 p-3">
							<div class="flex items-center gap-2 text-muted-foreground">
								<Eye class="h-4 w-4" />
								<span class="text-xs font-medium">Views</span>
							</div>
							<p class="mt-1 text-2xl font-bold text-card-foreground">
								{formatNumber(channel.totalViews)}
							</p>
							<p class="text-xs text-muted-foreground">last 30 days</p>
						</div>
					</div>

					{#if channel.latestVideo}
						<div class="mt-4 rounded-lg border border-border bg-background p-3">
							<div class="flex items-center gap-2">
								<TrendingUp class="h-3.5 w-3.5 text-primary" />
								<span class="text-xs font-medium text-muted-foreground">Latest Video</span>
							</div>
							<p class="mt-1.5 line-clamp-2 text-sm leading-snug font-medium text-card-foreground">
								{channel.latestVideo.title}
							</p>
							<p class="mt-1 text-xs text-muted-foreground">
								{formatNumber(channel.latestVideo.viewCount)} views
							</p>
						</div>
					{:else}
						<div class="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-3">
							<p class="text-center text-xs text-muted-foreground">No videos in the last 30 days</p>
						</div>
					{/if}
				</div>
			</a>
		{/each}
	</div>
{/if}
