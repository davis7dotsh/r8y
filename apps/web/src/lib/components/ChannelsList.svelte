<script lang="ts">
	import { remoteGetAllChannels } from '$lib/remote/channels.remote';
	import { formatNumber } from '$lib/utils';
	import { TrendingUp, Video, Eye } from '@lucide/svelte';
	import RootLoader from './RootLoader.svelte';
	import AppError from './AppError.svelte';
</script>

<svelte:boundary>
	{#snippet pending()}
		<RootLoader />
	{/snippet}

	{#snippet failed(err, retryFn)}
		<AppError {err} {retryFn} />
	{/snippet}

	{@const channels = await remoteGetAllChannels()}

	{#if channels.length === 0}
		<div
			class="border-border bg-muted/30 flex flex-col items-center justify-center rounded-xl border border-dashed p-12"
		>
			<div class="bg-muted rounded-full p-4">
				<Video class="text-muted-foreground h-8 w-8" />
			</div>
			<h3 class="text-foreground mt-4 text-lg font-medium">No channels yet</h3>
			<p class="text-muted-foreground mt-1 text-sm">
				Add a channel to get started tracking your content
			</p>
		</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each channels as channel}
				<a
					href="/app/view/channel/overview?channelId={channel.ytChannelId}"
					class="group border-border bg-card hover:border-primary/50 hover:shadow-primary/5 relative overflow-hidden rounded-xl border transition-all hover:shadow-lg"
				>
					<div class="p-5">
						<div class="flex items-start justify-between">
							<div class="min-w-0 flex-1">
								<h2
									class="text-card-foreground group-hover:text-primary truncate text-lg font-semibold transition-colors"
								>
									{channel.name}
								</h2>
								<p class="text-muted-foreground mt-0.5 truncate font-mono text-xs">
									{channel.ytChannelId}
								</p>
							</div>
						</div>

						<div class="mt-5 grid grid-cols-2 gap-3">
							<div class="bg-muted/50 rounded-lg p-3">
								<div class="text-muted-foreground flex items-center gap-2">
									<Video class="h-4 w-4" />
									<span class="text-xs font-medium">Videos</span>
								</div>
								<p class="text-card-foreground mt-1 text-2xl font-bold">
									{channel.videoCount}
								</p>
								<p class="text-muted-foreground text-xs">last 30 days</p>
							</div>
							<div class="bg-muted/50 rounded-lg p-3">
								<div class="text-muted-foreground flex items-center gap-2">
									<Eye class="h-4 w-4" />
									<span class="text-xs font-medium">Views</span>
								</div>
								<p class="text-card-foreground mt-1 text-2xl font-bold">
									{formatNumber(channel.totalViews)}
								</p>
								<p class="text-muted-foreground text-xs">last 30 days</p>
							</div>
						</div>

						{#if channel.latestVideo}
							<div class="border-border bg-background mt-4 rounded-lg border p-3">
								<div class="flex items-center gap-2">
									<TrendingUp class="text-primary h-3.5 w-3.5" />
									<span class="text-muted-foreground text-xs font-medium">Latest Video</span>
								</div>
								<p
									class="text-card-foreground mt-1.5 line-clamp-2 text-sm leading-snug font-medium"
								>
									{channel.latestVideo.title}
								</p>
								<p class="text-muted-foreground mt-1 text-xs">
									{formatNumber(channel.latestVideo.viewCount)} views
								</p>
							</div>
						{:else}
							<div class="border-border bg-muted/30 mt-4 rounded-lg border border-dashed p-3">
								<p class="text-muted-foreground text-center text-xs">
									No videos in the last 30 days
								</p>
							</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</svelte:boundary>
