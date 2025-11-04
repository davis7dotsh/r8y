<script lang="ts">
	import { remoteGetLast7VideosByViews } from '$lib/remote/channels.remote';

	const { channelId } = $props<{ channelId: string }>();

	const fullData = $derived(await remoteGetLast7VideosByViews(channelId));

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
</script>

{#if fullData.videos.length === 0}
	<div class="flex items-center justify-center rounded-lg border border-border bg-muted p-8">
		<p class="text-muted-foreground">No videos published in the last 7 days</p>
	</div>
{:else}
	<div>
		<h2 class="mb-4 text-xl font-semibold text-foreground">Last 7 Videos</h2>
		<div class="overflow-hidden rounded-lg border border-border bg-card">
			<table class="w-full">
				<thead>
					<tr class="border-b border-border">
						<th class="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
							Thumbnail
						</th>
						<th class="px-6 py-3 text-left text-sm font-medium text-muted-foreground"> Title </th>
						<th class="px-6 py-3 text-left text-sm font-medium text-muted-foreground"> Views </th>
						<th class="px-6 py-3 text-left text-sm font-medium text-muted-foreground"> Sponsor </th>
						<th class="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
							Days Ago
						</th>
						<th class="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
							Publish Date
						</th>
					</tr>
				</thead>
				<tbody>
					{#each fullData.videos as video}
						<tr class="border-b border-border last:border-0 hover:bg-accent">
							<td class="px-6 py-4">
								<a href="/app/channel/{channelId}/video/{video.ytVideoId}">
									<img
										src={video.thumbnailUrl}
										alt={video.title}
										class="h-16 w-28 rounded object-cover"
									/>
								</a>
							</td>
							<td class="px-6 py-4 text-sm text-card-foreground">
								<a
									href="/app/channel/{channelId}/video/{video.ytVideoId}"
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
										href="/app/channel/{channelId}/sponsor/{video.sponsor.sponsorId}"
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
	</div>
{/if}
