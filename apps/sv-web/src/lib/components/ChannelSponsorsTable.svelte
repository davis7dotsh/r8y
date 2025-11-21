<script lang="ts">
	import { remoteGetChannelSponsors } from '$lib/remote/channels.remote';

	const { channelId } = $props<{ channelId: string }>();

	const sponsors = $derived(await remoteGetChannelSponsors(channelId));

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

{#if sponsors.length === 0}
	<div class="rounded-lg border border-border bg-muted p-8">
		<p class="text-center text-muted-foreground">No sponsors found</p>
	</div>
{:else}
	<div>
		<h2 class="mb-4 text-xl font-semibold text-foreground">All Channel Sponsors</h2>
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
									href="/app/view/sponsor?sponsorId={sponsor.sponsorId}&channelId={channelId}"
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
	</div>
{/if}
