<script lang="ts">
	import {
		remoteGetChannelDetails,
		remoteGetChannelVideos,
		remoteGetChannelNotifications
	} from '$lib/remote/channels.remote';
	import { page } from '$app/state';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';

	const channelId = $derived(page.params.channelId as string);

	const channelPromise = $derived(remoteGetChannelDetails(channelId));
	const videosPromise = $derived(remoteGetChannelVideos(channelId));
	const notificationsPromise = $derived(remoteGetChannelNotifications(channelId));

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

	const formatRelativeTime = (date: Date) => {
		const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

		if (seconds < 60) return 'just now';
		if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
		if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

		return formatDate(date);
	};

	const getNotificationTypeLabel = (type: string) => {
		return type
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
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
						<Breadcrumb.Page>Loading...</Breadcrumb.Page>
					{:then channel}
						<Breadcrumb.Page>{channel.name}</Breadcrumb.Page>
					{:catch}
						<Breadcrumb.Page>Channel Not Found</Breadcrumb.Page>
					{/await}
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>
	<div class="mb-8 flex items-center justify-between">
		<div>
			{#await channelPromise}
				<div class="flex items-center gap-2">
					<Spinner class="size-6 text-muted-foreground" />
					<h1 class="text-3xl font-bold text-foreground">Loading...</h1>
				</div>
			{:then channel}
				<h1 class="text-3xl font-bold text-foreground">{channel.name}</h1>
				<p class="mt-2 text-sm text-muted-foreground">
					YouTube Channel ID: {channel.ytChannelId}
				</p>
			{:catch}
				<h1 class="text-3xl font-bold text-foreground">Channel Not Found</h1>
			{/await}
		</div>
		{#await channelPromise}
			<span></span>
		{:then channel}
			<a
				href="/app/channels/{channelId}/sponsors"
				class="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
			>
				View Sponsors
			</a>
		{/await}
	</div>

	{#await Promise.all([channelPromise, videosPromise, notificationsPromise])}
		<div class="flex items-center justify-center rounded-lg border border-border bg-muted p-8">
			<Spinner class="size-6 text-muted-foreground" />
		</div>
	{:then results}
		{@const [channel, videos, notifications] = results}
		{#if !channel}
			<div class="flex items-center justify-center rounded-lg border border-border bg-muted p-8">
				<div class="text-center">
					<p class="text-muted-foreground">Channel not found</p>
					<a href="/app/channels" class="mt-2 text-sm text-muted-foreground hover:text-foreground"
						>Return to channels</a
					>
				</div>
			</div>
		{:else}
			<div class="space-y-8">
				<div>
					<h2 class="mb-4 text-xl font-semibold text-foreground">Recent Videos</h2>
					{#if !videos || videos.length === 0}
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
											<td class="px-6 py-4 text-sm text-muted-foreground"
												>{formatNumber(video.viewCount)}</td
											>
											<td class="px-6 py-4 text-sm text-muted-foreground"
												>{formatNumber(video.likeCount)}</td
											>
											<td class="px-6 py-4 text-sm text-muted-foreground">
												{#if video.sponsor}
													<a
														href="/app/channels/{channelId}/sponsors/{video.sponsor.sponsorId}"
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
					{/if}
				</div>

				<div>
					<h2 class="mb-4 text-xl font-semibold text-foreground">Recent Notifications</h2>
					{#if !notifications || notifications.length === 0}
						<div class="rounded-lg border border-border bg-muted p-8">
							<p class="text-center text-muted-foreground">No notifications found</p>
						</div>
					{:else}
						<div class="overflow-hidden rounded-lg border border-border bg-card">
							<table class="w-full">
								<thead class="border-b border-border bg-muted">
									<tr>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
											>Type</th
										>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
											>Status</th
										>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
											>Message</th
										>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
											>Video</th
										>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
											>Time</th
										>
									</tr>
								</thead>
								<tbody class="divide-y divide-border">
									{#each notifications as notification}
										<tr class="hover:bg-muted/50">
											<td class="px-6 py-4">
												<Badge variant="secondary">
													{getNotificationTypeLabel(notification.type)}
												</Badge>
											</td>
											<td class="px-6 py-4">
												<Badge variant={notification.success ? 'default' : 'destructive'}>
													{notification.success ? 'Success' : 'Failed'}
												</Badge>
											</td>
											<td class="px-6 py-4">
												<p class="max-w-md text-sm text-card-foreground">{notification.message}</p>
											</td>
											<td class="px-6 py-4">
												<p class="max-w-md truncate text-sm text-muted-foreground">
													{notification.videoTitle}
												</p>
											</td>
											<td class="px-6 py-4 text-sm text-muted-foreground"
												>{formatRelativeTime(notification.createdAt)}</td
											>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	{:catch}
		<div
			class="flex items-center justify-center rounded-lg border border-destructive/20 bg-destructive/10 p-8"
		>
			<div class="text-destructive">Error loading channel data</div>
		</div>
	{/await}
</div>
