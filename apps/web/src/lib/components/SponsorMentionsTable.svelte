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

	const {
		sponsorData,
		channelId
	}: {
		sponsorData: Awaited<
			ReturnType<typeof import('$lib/remote/channels.remote').remoteGetSponsorDetails>
		>;
		channelId: string;
	} = $props();

	const getYouTubeCommentUrl = (videoId: string, commentId: string) => {
		return `https://www.youtube.com/watch?v=${videoId}&lc=${commentId}`;
	};

	type Comment = (typeof sponsorData.sponsorMentionComments)[number];

	const columns: ColumnDef<Comment>[] = [
		{
			accessorKey: 'text',
			header: 'Comment',
			size: 400,
			cell: ({ row }) =>
				renderComponent(ExpandableComment, {
					text: row.original.text
				})
		},
		{
			accessorKey: 'videoTitle',
			header: 'Video',
			size: 200,
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ comment: Comment; channelId: string }]>((params) => {
					const { comment, channelId } = params();
					return {
						render: () =>
							`<a href="/app/view/video?videoId=${comment.ytVideoId}&channelId=${channelId}" class="font-medium text-foreground transition-colors hover:text-primary block truncate" title="${comment.videoTitle}">${comment.videoTitle}</a>`
					};
				});
				return renderSnippet(snippet, { comment: row.original, channelId });
			}
		},
		{
			accessorKey: 'author',
			header: 'Author',
			size: 140,
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
			size: 80,
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
			size: 100,
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
			size: 50,
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
			return sponsorData.sponsorMentionComments;
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
			<h2 class="text-lg font-semibold text-foreground">Sponsor Mentions</h2>
			<Badge variant="secondary">{sponsorData.sponsorMentionComments.length}</Badge>
		</div>
	</div>
	{#if sponsorData.sponsorMentionComments.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-12"
		>
			<div class="rounded-full bg-muted p-3">
				<MessageSquare class="h-6 w-6 text-muted-foreground" />
			</div>
			<p class="mt-3 text-sm text-muted-foreground">No sponsor mentions found in comments</p>
		</div>
	{:else}
		<div class="overflow-hidden rounded-xl border border-border">
			<div class="max-h-[500px] overflow-y-auto">
				<Table.Root class="w-full table-fixed">
					<Table.Header class="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
						{#key sorting}
							{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
								<Table.Row class="hover:bg-transparent">
									{#each headerGroup.headers as header (header.id)}
										<Table.Head
											style="width: {header.getSize()}px"
											class="h-11 text-xs font-medium tracking-wide text-muted-foreground uppercase"
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
									<Table.Cell style="width: {cell.column.getSize()}px" class="py-3">
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
