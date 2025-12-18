<script lang="ts">
	import { MessageSquare } from '@lucide/svelte';
	import { createRawSnippet } from 'svelte';
	import {
		renderComponent,
		renderSnippet,
		createSvelteTable,
		FlexRender
	} from '$lib/components/ui/data-table/index.js';
	import DataTableColumnHeader from '$lib/components/ui/data-table/data-table-column-header.svelte';
	import ExpandableComment from '$lib/components/ExpandableComment.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import {
		getCoreRowModel,
		getSortedRowModel,
		type ColumnDef,
		type SortingState
	} from '@tanstack/table-core';
	import { formatDate } from '$lib/utils';
	import { remoteGetChannelSponsorMentions } from '$lib/remote/channels.remote';

	type SponsorMention = {
		ytVideoId: string;
		ytCommentId: string;
		text: string;
		videoTitle: string;
		author: string;
		likeCount: number;
		publishedAt: Date | string;
		sponsorName: string | null;
		sponsorId: string | null;
	};

	const { channelId }: { channelId: string } = $props();

	const mentions = $derived(await remoteGetChannelSponsorMentions(channelId));

	const getYouTubeCommentUrl = (videoId: string, commentId: string) => {
		return `https://www.youtube.com/watch?v=${videoId}&lc=${commentId}`;
	};

	const columns: ColumnDef<SponsorMention>[] = [
		{
			accessorKey: 'text',
			header: 'Comment',
			size: 350,
			cell: ({ row }) =>
				renderComponent(ExpandableComment, {
					text: row.original.text
				})
		},
		{
			accessorKey: 'videoTitle',
			header: 'Video',
			size: 180,
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ mention: SponsorMention; channelId: string }]>(
					(params) => {
						const { mention, channelId } = params();
						return {
							render: () =>
								`<a href="/app/view/video?videoId=${mention.ytVideoId}&channelId=${channelId}" class="font-medium text-foreground transition-colors hover:text-primary block truncate" title="${mention.videoTitle}">${mention.videoTitle}</a>`
						};
					}
				);
				return renderSnippet(snippet, { mention: row.original, channelId });
			}
		},
		{
			accessorKey: 'sponsorName',
			header: 'Sponsor',
			size: 120,
			cell: ({ row }) => {
				if (!row.original.sponsorName || !row.original.sponsorId) {
					const noneSnippet = createRawSnippet(() => ({
						render: () => `<span class="text-muted-foreground/50">—</span>`
					}));
					return renderSnippet(noneSnippet, {});
				}
				const snippet = createRawSnippet<
					[{ sponsorName: string; sponsorId: string; channelId: string }]
				>((params) => {
					const { sponsorName, sponsorId, channelId } = params();
					return {
						render: () =>
							`<a href="/app/view/sponsor?sponsorId=${sponsorId}&channelId=${channelId}" class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground">${sponsorName}</a>`
					};
				});
				return renderSnippet(snippet, {
					sponsorName: row.original.sponsorName,
					sponsorId: row.original.sponsorId,
					channelId
				});
			}
		},
		{
			accessorKey: 'author',
			header: 'Author',
			size: 120,
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ author: string }]>((params) => {
					const { author } = params();
					return {
						render: () => `<span class="text-muted-foreground truncate block">${author}</span>`
					};
				});
				return renderSnippet(snippet, { author: row.original.author });
			}
		},
		{
			accessorKey: 'likeCount',
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					title: 'Likes',
					isSorted: column.getIsSorted(),
					onclick: column.getToggleSortingHandler()
				}),
			size: 70,
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ likes: number }]>((params) => {
					const { likes } = params();
					return {
						render: () => `<span class="tabular-nums text-muted-foreground">${likes}</span>`
					};
				});
				return renderSnippet(snippet, { likes: row.original.likeCount });
			}
		},
		{
			accessorKey: 'publishedAt',
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					title: 'Date',
					isSorted: column.getIsSorted(),
					onclick: column.getToggleSortingHandler()
				}),
			size: 90,
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ date: Date | string }]>((params) => {
					const { date } = params();
					return {
						render: () => `<span class="text-muted-foreground">${formatDate(date)}</span>`
					};
				});
				return renderSnippet(snippet, { date: row.original.publishedAt });
			},
			sortingFn: 'datetime'
		},
		{
			id: 'link',
			header: '',
			size: 40,
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ videoId: string; commentId: string }]>((params) => {
					const { videoId, commentId } = params();
					const url = getYouTubeCommentUrl(videoId, commentId);
					return {
						render: () =>
							`<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg></a>`
					};
				});
				return renderSnippet(snippet, {
					videoId: row.original.ytVideoId,
					commentId: row.original.ytCommentId
				});
			}
		}
	];

	let sorting = $state<SortingState>([{ id: 'publishedAt', desc: true }]);

	const table = createSvelteTable({
		get data() {
			return mentions;
		},
		columns,
		state: {
			get sorting() {
				return sorting;
			}
		},
		onSortingChange: (updater) => {
			if (typeof updater === 'function') {
				sorting = updater(sorting);
			} else {
				sorting = updater;
			}
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<h2 class="text-foreground text-lg font-semibold">Recent Sponsor Mentions</h2>
			<Badge variant="secondary">{mentions.length}</Badge>
		</div>
	</div>
	{#if mentions.length === 0}
		<div
			class="border-border bg-muted/30 flex flex-col items-center justify-center rounded-xl border border-dashed p-12"
		>
			<div class="bg-muted rounded-full p-3">
				<MessageSquare class="text-muted-foreground h-6 w-6" />
			</div>
			<p class="text-muted-foreground mt-3 text-sm">No sponsor mentions found in comments</p>
		</div>
	{:else}
		<div class="border-border overflow-hidden rounded-xl border">
			<div class="max-h-[500px] overflow-y-auto">
				<Table.Root class="w-full table-fixed">
					<Table.Header class="bg-muted/80 sticky top-0 z-10 backdrop-blur-sm">
						{#key sorting}
							{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
								<Table.Row class="hover:bg-transparent">
									{#each headerGroup.headers as header (header.id)}
										<Table.Head
											style="width: {header.getSize()}px"
											class="text-muted-foreground h-11 text-xs font-medium tracking-wide uppercase"
										>
											{#if !header.isPlaceholder}
												<FlexRender
													content={header.column.columnDef.header}
													context={header.getContext()}
												/>
											{/if}
										</Table.Head>
									{/each}
								</Table.Row>
							{/each}
						{/key}
					</Table.Header>
					<Table.Body>
						{#each table.getRowModel().rows as row (row.id)}
							<Table.Row class="group">
								{#each row.getVisibleCells() as cell (cell.id)}
									<Table.Cell style="width: {cell.column.getSize()}px" class="overflow-hidden py-3">
										<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
									</Table.Cell>
								{/each}
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</div>
	{/if}
</div>
