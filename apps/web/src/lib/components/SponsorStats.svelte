<script lang="ts">
	import { formatNumber, formatDate } from '$lib/utils';
	import { Eye, Video, Calendar, TrendingUp } from '@lucide/svelte';

	const {
		sponsorData
	}: {
		sponsorData: Awaited<
			ReturnType<typeof import('$lib/remote/channels.remote').remoteGetSponsorDetails>
		>;
	} = $props();
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
	<div class="rounded-xl border border-border bg-card p-5">
		<div class="flex items-center gap-3">
			<div class="rounded-lg bg-primary/10 p-2">
				<Eye class="h-5 w-5 text-primary" />
			</div>
			<div>
				<p class="text-sm font-medium text-muted-foreground">Total Views</p>
				<p class="text-2xl font-bold text-card-foreground tabular-nums">
					{formatNumber(sponsorData.stats.totalViews)}
				</p>
			</div>
		</div>
	</div>
	<div class="rounded-xl border border-border bg-card p-5">
		<div class="flex items-center gap-3">
			<div class="rounded-lg bg-primary/10 p-2">
				<Video class="h-5 w-5 text-primary" />
			</div>
			<div>
				<p class="text-sm font-medium text-muted-foreground">Total Ads</p>
				<p class="text-2xl font-bold text-card-foreground tabular-nums">
					{sponsorData.stats.totalAds}
				</p>
			</div>
		</div>
	</div>
	<div class="rounded-xl border border-border bg-card p-5">
		<div class="flex items-center gap-3">
			<div class="rounded-lg bg-primary/10 p-2">
				<TrendingUp class="h-5 w-5 text-primary" />
			</div>
			<div>
				<p class="text-sm font-medium text-muted-foreground">Avg Views</p>
				<p class="text-2xl font-bold text-card-foreground tabular-nums">
					{formatNumber(sponsorData.stats.avgViewsPerVideo)}
				</p>
			</div>
		</div>
	</div>
	<div class="rounded-xl border border-border bg-card p-5">
		<div class="flex items-center gap-3">
			<div class="rounded-lg bg-primary/10 p-2">
				<Calendar class="h-5 w-5 text-primary" />
			</div>
			<div>
				<p class="text-sm font-medium text-muted-foreground">Last Publish</p>
				<p class="text-2xl font-bold text-card-foreground">
					{#if sponsorData.stats.lastPublishDate}
						{formatDate(new Date(sponsorData.stats.lastPublishDate))}
					{:else}
						<span class="text-muted-foreground">—</span>
					{/if}
				</p>
			</div>
		</div>
	</div>
</div>
