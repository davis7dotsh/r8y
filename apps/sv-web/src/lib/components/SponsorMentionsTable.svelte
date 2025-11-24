<script lang="ts">
	import { ExternalLink } from '@lucide/svelte';
	import { createRawSnippet } from 'svelte';
	import {
		renderComponent,
		renderSnippet,
		createSvelteTable,
		FlexRender
	} from '$lib/components/ui/data-table/index.js';
	import DataTableColumnHeader from '$lib/components/ui/data-table/data-table-column-header.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import {
		getCoreRowModel,
		getSortedRowModel,
		type ColumnDef,
		type SortingState
	} from '@tanstack/table-core';

	const {
		sponsorData,
		channelId
	}: {
		sponsorData: Awaited<
			ReturnType<typeof import('$lib/remote/channels.remote').remoteGetSponsorDetails>
		>;
		channelId: string;
	} = $props();

	const formatDate = (date: Date | string) => {
		const d = new Date(date);
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	const getYouTubeCommentUrl = (videoId: string, commentId: string) => {
		return `https://www.youtube.com/watch?v=${videoId}&lc=${commentId}`;
	};

	type Comment = (typeof sponsorData.sponsorMentionComments)[number];

	const columns: ColumnDef<Comment>[] = [
		{
			accessorKey: 'text',
			header: 'Comment',
			size: 400,
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ text: string }]>((params) => {
					const { text } = params();
					const escaped = text
						.replace(/&/g, '&amp;')
						.replace(/</g, '&lt;')
						.replace(/>/g, '&gt;')
						.replace(/"/g, '&quot;');
					return {
						render: () =>
							`<p class="text-sm text-card-foreground whitespace-normal break-words" title="${escaped}">${escaped}</p>`
					};
				});
				return renderSnippet(snippet, { text: row.original.text });
			}
		},
		{
			accessorKey: 'videoTitle',
			header: 'Video',
			size: 180,
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ comment: Comment; channelId: string }]>((params) => {
					const { comment, channelId } = params();
					return {
						render: () =>
							`<a href="/app/view/video?videoId=${comment.ytVideoId}&channelId=${channelId}" class="text-sm font-medium text-card-foreground transition-colors hover:text-primary block truncate" title="${comment.videoTitle}">${comment.videoTitle}</a>`
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
						render: () => `<div class="text-sm text-muted-foreground truncate">${author}</div>`
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
						render: () => `<div class="text-sm text-muted-foreground">${likes}</div>`
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
						render: () => `<div class="text-sm text-muted-foreground">${formatDate(date)}</div>`
					};
				});
				return renderSnippet(snippet, { date: row.original.publishedAt });
			},
			sortingFn: 'datetime'
		},
		{
			id: 'link',
			header: 'Link',
			size: 60,
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ videoId: string; commentId: string }]>((params) => {
					const { videoId, commentId } = params();
					const url = getYouTubeCommentUrl(videoId, commentId);
					return {
						render: () =>
							`<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center text-primary hover:underline"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg></a>`
					};
				});
				return renderSnippet(snippet, {
					videoId: row.original.ytVideoId,
					commentId: row.original.ytCommentId
				});
			}
		}
	];

	let sorting = $state<SortingState>([]);

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

<div>
	<h2 class="mb-4 text-xl font-semibold text-foreground">Sponsor Mentions</h2>
	{#if sponsorData.sponsorMentionComments.length === 0}
		<div class="rounded-lg border border-border bg-muted p-8">
			<p class="text-center text-muted-foreground">No sponsor mentions found</p>
		</div>
	{:else}
		<div class="max-h-[500px] overflow-hidden rounded-lg border border-border bg-card">
			<div class="max-h-[500px] overflow-y-auto">
				<Table.Root style="width: fit-content; min-width: 100%;">
					<Table.Header class="sticky top-0 z-10 bg-muted">
						{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
							<Table.Row>
								{#each headerGroup.headers as header (header.id)}
									<Table.Head style="width: {header.getSize()}px; min-width: {header.getSize()}px;">
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
					</Table.Header>
					<Table.Body>
						{#each table.getRowModel().rows as row (row.id)}
							<Table.Row data-state={row.getIsSelected() && 'selected'}>
								{#each row.getVisibleCells() as cell (cell.id)}
									<Table.Cell
										style="width: {cell.column.getSize()}px; min-width: {cell.column.getSize()}px;"
									>
										<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
									</Table.Cell>
								{/each}
							</Table.Row>
						{:else}
							<Table.Row>
								<Table.Cell colspan={columns.length} class="h-24 text-center"
									>No results.</Table.Cell
								>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</div>
	{/if}
</div>
