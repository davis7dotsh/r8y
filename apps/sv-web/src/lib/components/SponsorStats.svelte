<script lang="ts">
	const {
		sponsorData
	}: {
		sponsorData: Awaited<
			ReturnType<typeof import('$lib/remote/channels.remote').remoteGetSponsorDetails>
		>;
	} = $props();

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
