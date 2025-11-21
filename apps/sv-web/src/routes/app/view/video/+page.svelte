<script lang="ts">
	import { remoteGetVideoDetails, remoteGetChannelDetails } from '$lib/remote/channels.remote';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import VideoNotificationsTable from '$lib/components/VideoNotificationsTable.svelte';
	import VideoCommentsTable from '$lib/components/VideoCommentsTable.svelte';
	import ChannelHeader from '$lib/components/ChannelHeader.svelte';
	import z from 'zod';
	import { useSearchParams } from 'runed/kit';

	const videoParamsSchema = z.object({
		videoId: z.string().default(''),
		channelId: z.string().default('')
	});

	const params = useSearchParams(videoParamsSchema);

	const videoId = $derived(params.videoId);
	const channelId = $derived(params.channelId);

	const videoData = $derived(await remoteGetVideoDetails(videoId));
	const channel = $derived(await remoteGetChannelDetails(channelId));

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

<div class="flex flex-col gap-4 p-8">
	<ChannelHeader {channelId} />
	<div class="mb-6">
		<Breadcrumb.Root>
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/app">Channels</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/app/view/channel?channelId={channelId}">{channel.name}</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>{videoData.video.title}</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-foreground">{videoData.video.title}</h1>
			<p class="mt-2 text-sm text-muted-foreground">
				Published: {formatDate(videoData.video.publishedAt)}
			</p>
		</div>
	</div>

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
							href="/app/view/channel?channelId={videoData.channel.ytChannelId}"
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
							href="/app/view/sponsor?sponsorId={videoData.sponsor.sponsorId}&channelId={channelId}"
							class="mt-1 inline-flex items-center rounded-full px-3 py-1 font-medium text-primary ring-2 ring-primary transition-colors hover:bg-primary hover:text-primary-foreground"
						>
							{videoData.sponsor.name}
						</a>
					</div>
				{/if}
			</div>
		</div>

		<VideoNotificationsTable {videoData} />
		<VideoCommentsTable {videoData} />
	</div>
</div>
