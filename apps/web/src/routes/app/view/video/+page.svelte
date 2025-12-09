<script lang="ts">
	import { remoteGetVideoDetails, remoteGetChannelDetails } from '$lib/remote/channels.remote';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import VideoNotificationsTable from '$lib/components/VideoNotificationsTable.svelte';
	import VideoCommentsTable from '$lib/components/VideoCommentsTable.svelte';
	import ChannelHeader from '$lib/components/ChannelHeader.svelte';
	import z from 'zod';
	import { useSearchParams } from 'runed/kit';
	import { formatNumber, formatDate } from '$lib/utils';
	import { Eye, ThumbsUp, ExternalLink } from '@lucide/svelte';

	const videoParamsSchema = z.object({
		videoId: z.string().default(''),
		channelId: z.string().default('')
	});

	const params = useSearchParams(videoParamsSchema);

	const videoId = $derived(params.videoId);
	const channelId = $derived(params.channelId);

	const videoData = $derived(await remoteGetVideoDetails(videoId));
	const channel = $derived(await remoteGetChannelDetails(channelId));
</script>

<svelte:head>
	<title>{videoData.video.title} - r8y 3.0</title>
	<meta
		name="description"
		content="View video analytics, comments, notifications, and sponsor details for {videoData.video
			.title}."
	/>
</svelte:head>

<div class="flex flex-col gap-6 p-8 pb-24">
	<ChannelHeader {channelId} />

	<Breadcrumb.Root>
		<Breadcrumb.List>
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/app">Channels</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/app/view/channel?channelId={channelId}"
					>{channel.name}</Breadcrumb.Link
				>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Page class="max-w-[300px] truncate">{videoData.video.title}</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>

	<!-- Video Header -->
	<div class="rounded-xl border border-border bg-card p-6">
		<div class="flex gap-6">
			<a
				href="https://www.youtube.com/watch?v={videoData.video.ytVideoId}"
				target="_blank"
				rel="noopener noreferrer"
				class="group relative shrink-0"
			>
				<img
					src={videoData.video.thumbnailUrl}
					alt={videoData.video.title}
					class="h-36 w-64 rounded-lg object-cover transition-all group-hover:ring-2 group-hover:ring-primary/50"
				/>
				<div
					class="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 transition-all group-hover:bg-black/20"
				>
					<ExternalLink
						class="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100"
					/>
				</div>
			</a>
			<div class="flex flex-1 flex-col justify-between">
				<div>
					<a
						href="https://www.youtube.com/watch?v={videoData.video.ytVideoId}"
						target="_blank"
						rel="noopener noreferrer"
						class="line-clamp-2 text-xl font-semibold text-foreground transition-colors hover:text-primary"
					>
						{videoData.video.title}
					</a>
					<p class="mt-1 text-sm text-muted-foreground">
						Published {formatDate(videoData.video.publishedAt)}
					</p>
				</div>
				<div class="flex items-center gap-6">
					<div class="flex items-center gap-2">
						<div class="rounded-lg bg-primary/10 p-2">
							<Eye class="h-4 w-4 text-primary" />
						</div>
						<div>
							<p class="text-xs text-muted-foreground">Views</p>
							<p class="text-lg font-bold tabular-nums">
								{formatNumber(videoData.video.viewCount)}
							</p>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<div class="rounded-lg bg-primary/10 p-2">
							<ThumbsUp class="h-4 w-4 text-primary" />
						</div>
						<div>
							<p class="text-xs text-muted-foreground">Likes</p>
							<p class="text-lg font-bold tabular-nums">
								{formatNumber(videoData.video.likeCount)}
							</p>
						</div>
					</div>
					{#if videoData.sponsor}
						<div class="ml-auto">
							<p class="mb-1 text-xs text-muted-foreground">Sponsor</p>
							<a
								href="/app/view/sponsor?sponsorId={videoData.sponsor
									.sponsorId}&channelId={channelId}"
								class="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
							>
								{videoData.sponsor.name}
							</a>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<div class="space-y-6">
		<VideoNotificationsTable {videoData} />
		<VideoCommentsTable {videoData} />
	</div>
</div>
