<script lang="ts">
	import { Pencil, DollarSign, MessageSquare } from '@lucide/svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
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
	import {
		getCoreRowModel,
		getSortedRowModel,
		getFilteredRowModel,
		type ColumnDef,
		type SortingState,
		type ColumnFiltersState
	} from '@tanstack/table-core';
	import { formatNumber, formatDate } from '$lib/utils';

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

	type Comments = ColumnDef<(typeof videoData.comments)[number]>[];

	const columns: Comments = [
		{
			accessorKey: 'author',
			header: 'Author',
			size: 140,
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ author: string }]>((params) => {
					const { author } = params();
					return {
						render: () =>
							`<span class="font-medium text-foreground truncate block">${author}</span>`
					};
				});
				return renderSnippet(snippet, { author: row.original.author });
			}
		},
		{
			accessorKey: 'text',
			header: 'Comment',
			size: 300,
			cell: ({ row }) =>
				renderComponent(ExpandableComment, {
					text: row.original.text
				})
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
						render: () =>
							`<span class="tabular-nums text-muted-foreground">${formatNumber(likes)}</span>`
					};
				});
				return renderSnippet(snippet, { likes: row.original.likeCount });
			}
		},
		{
			accessorKey: 'replyCount',
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					title: 'Replies',
					isSorted: column.getIsSorted(),
					onclick: column.getToggleSortingHandler()
				}),
			size: 80,
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ replies: number }]>((params) => {
					const { replies } = params();
					return {
						render: () =>
							`<span class="tabular-nums text-muted-foreground">${formatNumber(replies)}</span>`
					};
				});
				return renderSnippet(snippet, { replies: row.original.replyCount });
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
				const snippet = createRawSnippet<[{ date: Date }]>((params) => {
					const { date } = params();
					return {
						render: () => `<span class="text-muted-foreground text-sm">${formatDate(date)}</span>`
					};
				});
				return renderSnippet(snippet, { date: row.original.publishedAt });
			},
			sortingFn: 'datetime'
		},
		{
			accessorKey: 'flags',
			header: 'Tags',
			size: 160,
			cell: ({ row }) => {
				const snippet = createRawSnippet(() => {
					const comment = row.original;
					const badges: string[] = [];
					if (comment.isEditingMistake) {
						badges.push(
							'<span class="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">Edit</span>'
						);
					}
					if (comment.isSponsorMention) {
						badges.push(
							'<span class="inline-flex items-center gap-1 rounded-md bg-green-500/10 px-1.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">Sponsor</span>'
						);
					}
					if (comment.isQuestion) {
						badges.push(
							'<span class="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-1.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">Question</span>'
						);
					}
					if (comment.isPositiveComment) {
						badges.push(
							'<span class="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">Positive</span>'
						);
					}
					if (badges.length === 0) {
						return { render: () => `<span class="text-muted-foreground/50">—</span>` };
					}
					return {
						render: () => `<div class="flex flex-wrap gap-1">${badges.join('')}</div>`
					};
				});
				return renderSnippet(snippet, {});
			}
		},
		{
			id: 'link',
			header: '',
			size: 50,
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ videoId: string; commentId: string }]>((params) => {
					const { videoId, commentId } = params();
					const url = `https://www.youtube.com/watch?v=${videoId}&lc=${commentId}`;
					return {
						render: () =>
							`<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg></a>`
					};
				});
				return renderSnippet(snippet, {
					videoId: videoData.video.ytVideoId,
					commentId: row.original.ytCommentId
				});
			}
		}
	];

	let sorting = $state<SortingState>([{ id: 'publishedAt', desc: true }]);
	let columnFilters = $state<ColumnFiltersState>([]);

	const table = createSvelteTable({
		get data() {
			return filteredComments;
		},
		columns,
		state: {
			get sorting() {
				return sorting;
			},
			get columnFilters() {
				return columnFilters;
			}
		},
		onSortingChange: (updater) => {
			if (typeof updater === 'function') {
				sorting = updater(sorting);
			} else {
				sorting = updater;
			}
		},
		onColumnFiltersChange: (updater) => {
			if (typeof updater === 'function') {
				columnFilters = updater(columnFilters);
			} else {
				columnFilters = updater;
			}
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel()
	});

	const activeFiltersCount = $derived(
		[showQuestions, showSponsorMentions, showEditingMistakes].filter(Boolean).length
	);
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<h2 class="text-lg font-semibold text-foreground">Comments</h2>
			<Badge variant="secondary">{videoData.comments?.length ?? 0}</Badge>
			{#if activeFiltersCount > 0}
				<Badge variant="outline" class="text-primary">{filteredComments.length} shown</Badge>
			{/if}
		</div>
	</div>
	{#if !videoData.comments || videoData.comments.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-12"
		>
			<div class="rounded-full bg-muted p-3">
				<MessageSquare class="h-6 w-6 text-muted-foreground" />
			</div>
			<p class="mt-3 text-sm text-muted-foreground">No comments found for this video</p>
		</div>
	{:else}
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<Input
				placeholder="Search comments..."
				value={(table.getColumn('text')?.getFilterValue() as string) ?? ''}
				oninput={(e) => table.getColumn('text')?.setFilterValue(e.currentTarget.value)}
				class="max-w-sm"
			/>

			<div class="flex flex-wrap items-center gap-2">
				<span class="mr-1 text-xs text-muted-foreground">Filter:</span>
				<Button
					variant={showQuestions ? 'default' : 'outline'}
					size="sm"
					onclick={() => (showQuestions = !showQuestions)}
					class="h-8"
				>
					<span class="text-sm font-bold">?</span>
					Questions
				</Button>
				<Button
					variant={showSponsorMentions ? 'default' : 'outline'}
					size="sm"
					onclick={() => (showSponsorMentions = !showSponsorMentions)}
					class="h-8"
				>
					<DollarSign class="h-3.5 w-3.5" />
					Sponsors
				</Button>
				<Button
					variant={showEditingMistakes ? 'default' : 'outline'}
					size="sm"
					onclick={() => (showEditingMistakes = !showEditingMistakes)}
					class="h-8"
				>
					<Pencil class="h-3.5 w-3.5" />
					Edits
				</Button>
			</div>
		</div>
		{#if table.getRowModel().rows.length === 0}
			<div
				class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-12"
			>
				<p class="text-sm text-muted-foreground">No comments match your filters</p>
				<Button
					variant="ghost"
					size="sm"
					class="mt-2"
					onclick={() => {
						showQuestions = false;
						showSponsorMentions = false;
						showEditingMistakes = false;
						table.getColumn('text')?.setFilterValue('');
					}}
				>
					Clear filters
				</Button>
			</div>
		{:else}
			<div class="overflow-hidden rounded-xl border border-border">
				<div class="max-h-[600px] overflow-y-auto">
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
											<FlexRender
												content={cell.column.columnDef.cell}
												context={cell.getContext()}
											/>
										</Table.Cell>
									{/each}
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			</div>
		{/if}
	{/if}
</div>
