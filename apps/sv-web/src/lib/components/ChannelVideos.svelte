<script lang="ts">
	import { remoteGetChannelVideos } from '$lib/remote/channels.remote';

	const { channelId }: { channelId: string } = $props();

	const videos = $derived(await remoteGetChannelVideos(channelId));

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

<div>
	<h2 class="mb-4 text-xl font-semibold text-foreground">Recent Videos</h2>
	{#if videos.length === 0}
		<div class="rounded-lg border border-border bg-muted p-8">
			<p class="text-center text-muted-foreground">No videos found</p>
		</div>
	{:else}
		<div class="max-h-[600px] overflow-hidden rounded-lg border border-border bg-card">
			<div class="max-h-[600px] overflow-y-auto">
				<table class="w-full">
					<thead class="sticky top-0 z-10 border-b border-border bg-muted">
						<tr>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
								>Thumbnail</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
								>Title</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
								>Views</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
								>Likes</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
								>Sponsor</th
							>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
								>Published</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each videos as video}
							<tr class="hover:bg-muted/50">
								<td class="px-6 py-4">
									<a href="/app/view/video?videoId={video.ytVideoId}&channelId={channelId}">
										<img
											src={video.thumbnailUrl}
											alt={video.title}
											class="h-12 w-20 rounded object-cover transition-opacity hover:opacity-80"
										/>
									</a>
								</td>
								<td class="px-6 py-4">
									<a
										href="/app/view/video?videoId={video.ytVideoId}&channelId={channelId}"
										class="max-w-md truncate text-sm font-medium text-card-foreground transition-colors hover:text-primary"
									>
										{video.title}
									</a>
								</td>
								<td class="px-6 py-4 text-sm text-muted-foreground"
									>{formatNumber(video.viewCount)}</td
								>
								<td class="px-6 py-4 text-sm text-muted-foreground"
									>{formatNumber(video.likeCount)}</td
								>
								<td class="px-6 py-4 text-sm text-muted-foreground">
									{#if video.sponsor}
										<a
											href="/app/view/sponsor?sponsorId={video.sponsor
												.sponsorId}&channelId={channelId}"
											class="inline-flex items-center rounded-full px-3 py-1 font-medium text-primary ring-2 ring-primary transition-colors hover:bg-primary hover:text-primary-foreground"
										>
											{video.sponsor.name}
										</a>
									{:else}
										None
									{/if}
								</td>
								<td class="px-6 py-4 text-sm text-muted-foreground"
									>{formatDate(video.publishedAt)}</td
								>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
