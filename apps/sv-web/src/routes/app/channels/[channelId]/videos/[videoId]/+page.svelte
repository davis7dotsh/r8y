<script lang="ts">
	import { remoteGetVideoDetails, remoteGetChannelDetails } from '$lib/remote/channels.remote';
	import { Pencil, DollarSign, ThumbsUp, Check, CircleHelp } from '@lucide/svelte';
	import { page } from '$app/state';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';

	const channelId = $derived(page.params.channelId as string);
	const videoId = $derived(page.params.videoId as string);

	const videoPromise = $derived(remoteGetVideoDetails(videoId));
	const channelPromise = $derived(remoteGetChannelDetails(channelId));

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

	let showQuestions = $state(false);
	let showSponsorMentions = $state(false);
	let showEditingMistakes = $state(false);

	let videoDataCache = $state<Awaited<typeof videoPromise> | null>(null);

	$effect(() => {
		videoPromise.then((data) => {
			videoDataCache = data;
		});
	});

	const filteredComments = $derived.by(() => {
		if (!videoDataCache?.comments) return [];
		const comments = videoDataCache.comments;
		if (!showQuestions && !showSponsorMentions && !showEditingMistakes) {
			return comments;
		}
		return comments.filter((comment) => {
			if (showQuestions && comment.isQuestion) return true;
			if (showSponsorMentions && comment.isSponsorMention) return true;
			if (showEditingMistakes && comment.isEditingMistake) return true;
			return false;
		});
	});
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
						<Breadcrumb.Link href="/app/channels/{channelId}">Loading...</Breadcrumb.Link>
					{:then channel}
						<Breadcrumb.Link href="/app/channels/{channelId}">{channel.name}</Breadcrumb.Link>
					{:catch}
						<Breadcrumb.Link href="/app/channels/{channelId}">Channel</Breadcrumb.Link>
					{/await}
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					{#await videoPromise}
						<Breadcrumb.Page>Loading...</Breadcrumb.Page>
					{:then videoData}
						<Breadcrumb.Page>{videoData.video.title}</Breadcrumb.Page>
					{:catch}
						<Breadcrumb.Page>Video Not Found</Breadcrumb.Page>
					{/await}
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>
	<div class="mb-8 flex items-center justify-between">
		<div>
			{#await videoPromise}
				<div class="flex items-center gap-2">
					<Spinner class="size-6 text-muted-foreground" />
					<h1 class="text-3xl font-bold text-foreground">Loading...</h1>
				</div>
			{:then videoData}
				<h1 class="text-3xl font-bold text-foreground">{videoData.video.title}</h1>
				<p class="mt-2 text-sm text-muted-foreground">
					Published: {formatDate(videoData.video.publishedAt)}
				</p>
			{:catch}
				<h1 class="text-3xl font-bold text-foreground">Video Not Found</h1>
			{/await}
		</div>
	</div>

	{#await videoPromise}
		<div class="flex items-center justify-center rounded-lg border border-border bg-muted p-8">
			<Spinner class="size-6 text-muted-foreground" />
		</div>
	{:then videoData}
		<div class="space-y-8">
			<div class="flex gap-4">
				<div>
					<img
						src={videoData.video.thumbnailUrl}
						alt={videoData.video.title}
						class="h-32 w-56 rounded-lg object-cover"
					/>
				</div>
				<div class="flex items-center gap-6">
					<div>
						<h2 class="text-sm font-medium text-muted-foreground">Channel</h2>
						{#if videoData.channel}
							<a
								href="/app/channels/{videoData.channel.ytChannelId}"
								class="mt-1 text-lg font-semibold text-foreground hover:text-primary"
							>
								{videoData.channel.name}
							</a>
						{/if}
					</div>
					<div>
						<h3 class="text-sm font-medium text-muted-foreground">Views</h3>
						<p class="mt-1 text-2xl font-bold text-foreground">
							{formatNumber(videoData.video.viewCount)}
						</p>
					</div>
					<div>
						<h3 class="text-sm font-medium text-muted-foreground">Likes</h3>
						<p class="mt-1 text-2xl font-bold text-foreground">
							{formatNumber(videoData.video.likeCount)}
						</p>
					</div>
					{#if videoData.sponsor}
						<div>
							<h3 class="text-sm font-medium text-muted-foreground">Sponsor</h3>
							<a
								href="/app/channels/{channelId}/sponsors/{videoData.sponsor.sponsorId}"
								class="mt-1 inline-flex items-center rounded-full px-3 py-1 font-medium text-primary ring-2 ring-primary transition-colors hover:bg-primary hover:text-primary-foreground"
							>
								{videoData.sponsor.name}
							</a>
						</div>
					{/if}
				</div>
			</div>

			<div>
				<h2 class="mb-4 text-xl font-semibold text-foreground">Sent Notifications</h2>
				{#if !videoData.notifications || videoData.notifications.length === 0}
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
									>
										Type
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
									>
										Status
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
									>
										Message
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
									>
										Time
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								{#each videoData.notifications as notification}
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
										<td class="px-6 py-4 text-sm text-muted-foreground">
											{formatRelativeTime(notification.createdAt)}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>

			<div>
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-xl font-semibold text-foreground">Comments</h2>
					{#if videoData.comments && videoData.comments.length > 0}
						<div class="flex items-center gap-2">
							<Button
								variant={showQuestions ? 'default' : 'outline'}
								size="sm"
								onclick={() => (showQuestions = !showQuestions)}
							>
								<CircleHelp class="h-4 w-4" />
								Questions
							</Button>
							<Button
								variant={showSponsorMentions ? 'default' : 'outline'}
								size="sm"
								onclick={() => (showSponsorMentions = !showSponsorMentions)}
							>
								<DollarSign class="h-4 w-4" />
								Sponsor Mentions
							</Button>
							<Button
								variant={showEditingMistakes ? 'default' : 'outline'}
								size="sm"
								onclick={() => (showEditingMistakes = !showEditingMistakes)}
							>
								<Pencil class="h-4 w-4" />
								Edit Mistakes
							</Button>
						</div>
					{/if}
				</div>
				{#if !videoData.comments || videoData.comments.length === 0}
					<div class="rounded-lg border border-border bg-muted p-8">
						<p class="text-center text-muted-foreground">No comments found</p>
					</div>
				{:else if filteredComments.length === 0}
					<div class="rounded-lg border border-border bg-muted p-8">
						<p class="text-center text-muted-foreground">No comments match the selected filters</p>
					</div>
				{:else}
					<div class="max-h-96 overflow-auto rounded-lg border border-border bg-card">
						<table class="w-full">
							<thead class="sticky top-0 border-b border-border bg-muted">
								<tr>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
									>
										Author
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
									>
										Comment
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
									>
										Flags
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
									>
										Likes
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
									>
										Replies
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
									>
										Published
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								{#each filteredComments as comment}
									<tr class="hover:bg-muted/50">
										<td class="px-6 py-4">
											<p class="text-sm font-medium text-card-foreground">{comment.author}</p>
										</td>
										<td class="px-6 py-4">
											<p class="max-w-md text-sm text-card-foreground">{comment.text}</p>
										</td>
										<td class="px-6 py-4">
											<div class="flex flex-wrap gap-1">
												{#if comment.isEditingMistake}
													<Badge variant="outline" class="gap-1">
														<Pencil class="h-3 w-3" />
														Edit
													</Badge>
												{/if}
												{#if comment.isSponsorMention}
													<Badge variant="outline" class="gap-1">
														<DollarSign class="h-3 w-3" />
														Sponsor
													</Badge>
												{/if}
												{#if comment.isQuestion}
													<Badge variant="outline" class="gap-1">
														<CircleHelp class="h-3 w-3" />
														Question
													</Badge>
												{/if}
												{#if comment.isPositiveComment}
													<Badge variant="default" class="gap-1">
														<ThumbsUp class="h-3 w-3" />
														Positive
													</Badge>
												{/if}
												{#if comment.isProcessed}
													<Badge variant="secondary" class="gap-1">
														<Check class="h-3 w-3" />
														Processed
													</Badge>
												{/if}
											</div>
										</td>
										<td class="px-6 py-4 text-sm text-muted-foreground">
											{formatNumber(comment.likeCount)}
										</td>
										<td class="px-6 py-4 text-sm text-muted-foreground">
											{formatNumber(comment.replyCount)}
										</td>
										<td class="px-6 py-4 text-sm text-muted-foreground">
											{formatDate(comment.publishedAt)}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>
	{:catch}
		<div class="flex items-center justify-center rounded-lg border border-border bg-muted p-8">
			<div class="text-center">
				<p class="text-muted-foreground">Video not found</p>
				<a
					href="/app/channels/{channelId}"
					class="mt-2 text-sm text-muted-foreground hover:text-foreground">Return to channel</a
				>
			</div>
		</div>
	{/await}
</div>
