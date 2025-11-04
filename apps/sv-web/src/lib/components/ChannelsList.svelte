<script lang="ts">
	import { remoteGetChannelsWithStats } from '$lib/remote/channels.remote';

	const channels = $derived(await remoteGetChannelsWithStats());

	const formatNumber = (num: number) => {
		if (num >= 1000000) {
			return (num / 1000000).toFixed(1) + 'M';
		}
		if (num >= 1000) {
			return (num / 1000).toFixed(1) + 'K';
		}
		return num.toString();
	};
</script>

{#if channels.length === 0}
	<div class="flex items-center justify-center rounded-lg border border-border bg-muted p-8">
		<div class="text-center">
			<p class="text-muted-foreground">No channels found</p>
			<p class="mt-2 text-sm text-muted-foreground">Add a channel to get started</p>
		</div>
	</div>
{:else}
	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each channels as channel}
			<a
				href="/app/channel/{channel.ytChannelId}"
				class="block overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
			>
				<div class="p-6">
					<h2 class="text-xl font-semibold text-card-foreground">{channel.name}</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						YouTube Channel ID: {channel.ytChannelId}
					</p>

					<div class="mt-6 space-y-4">
						<div class="flex items-center justify-between border-b border-border pb-3">
							<span class="text-sm font-medium text-muted-foreground">Videos (30 days)</span>
							<span class="text-lg font-semibold text-card-foreground">{channel.videoCount}</span>
						</div>

						<div class="flex items-center justify-between border-b border-border pb-3">
							<span class="text-sm font-medium text-muted-foreground">Total Views (30 days)</span>
							<span class="text-lg font-semibold text-card-foreground"
								>{formatNumber(channel.totalViews)}</span
							>
						</div>

						{#if channel.latestVideo}
							<div class="pt-3">
								<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									Latest Video
								</p>
								<p class="mt-1 line-clamp-2 text-sm text-card-foreground">
									{channel.latestVideo.title}
								</p>
								<p class="mt-2 text-sm text-muted-foreground">
									{formatNumber(channel.latestVideo.viewCount)} views
								</p>
							</div>
						{:else}
							<div class="pt-3">
								<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									Latest Video
								</p>
								<p class="mt-1 text-sm text-muted-foreground">No videos in the last 30 days</p>
							</div>
						{/if}
					</div>
				</div>
			</a>
		{/each}
	</div>
{/if}
