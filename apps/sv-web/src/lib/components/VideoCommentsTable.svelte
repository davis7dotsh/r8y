<script lang="ts">
	import { Pencil, DollarSign, ThumbsUp, Check, CircleHelp } from '@lucide/svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';

	const {
		videoData
	}: {
		videoData: Awaited<
			ReturnType<typeof import('$lib/remote/channels.remote').remoteGetVideoDetails>
		>;
	} = $props();

	let showQuestions = $state(false);
	let showSponsorMentions = $state(false);
	let showEditingMistakes = $state(false);

	const filteredComments = $derived.by(() => {
		if (!videoData.comments) return [];
		const comments = videoData.comments;
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
