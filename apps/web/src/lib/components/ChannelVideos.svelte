<script lang="ts">
	import { remoteGetChannelVideos } from '$lib/remote/channels.remote';
	import { createRawSnippet } from 'svelte';
	import {
		renderComponent,
		renderSnippet,
		createSvelteTable,
		FlexRender
	} from '$lib/components/ui/data-table/index.js';
	import DataTableColumnHeader from '$lib/components/ui/data-table/data-table-column-header.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import {
		getCoreRowModel,
		getSortedRowModel,
		type ColumnDef,
		type SortingState
	} from '@tanstack/table-core';
	import { formatNumber, formatDate } from '$lib/utils';
	import { Video } from '@lucide/svelte';

	const { channelId }: { channelId: string } = $props();

	const videos = $derived(await remoteGetChannelVideos(channelId));

	type VideoType = {
		ytVideoId: string;
		title: string;
		thumbnailUrl: string;
		viewCount: number;
		likeCount: number;
		publishedAt: Date | string;
		sponsor: {
			name: string;
			sponsorId: string;
		} | null;
	};

	const columns: ColumnDef<VideoType>[] = [
		{
			accessorKey: 'thumbnailUrl',
			header: '',
			size: 80,
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ video: VideoType; channelId: string }]>((params) => {
					const { video, channelId } = params();
					return {
						render: () =>
							`<a href="/app/view/video?videoId=${video.ytVideoId}&channelId=${channelId}" class="block"><img src="${video.thumbnailUrl}" alt="" class="h-10 w-16 rounded object-cover transition-opacity hover:opacity-80" /></a>`
					};
				});
				return renderSnippet(snippet, { video: row.original, channelId });
			}
		},
		{
			accessorKey: 'title',
			header: 'Title',
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ video: VideoType; channelId: string }]>((params) => {
					const { video, channelId } = params();
					return {
						render: () =>
							`<a href="/app/view/video?videoId=${video.ytVideoId}&channelId=${channelId}" class="block max-w-md truncate font-medium text-foreground transition-colors hover:text-primary">${video.title}</a>`
					};
				});
				return renderSnippet(snippet, { video: row.original, channelId });
			}
		},
		{
			accessorKey: 'viewCount',
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					title: 'Views',
					isSorted: column.getIsSorted(),
					onclick: column.getToggleSortingHandler()
				}),
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ views: number }]>((params) => {
					const { views } = params();
					return {
						render: () => `<span class="tabular-nums">${formatNumber(views)}</span>`
					};
				});
				return renderSnippet(snippet, { views: row.original.viewCount });
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
			accessorKey: 'sponsor',
			header: 'Sponsor',
			cell: ({ row }) => {
				if (!row.original.sponsor) {
					const noneSnippet = createRawSnippet(() => ({
						render: () => `<span class="text-muted-foreground/50">—</span>`
					}));
					return renderSnippet(noneSnippet, {});
				}
				const snippet = createRawSnippet<
					[{ sponsor: NonNullable<VideoType['sponsor']>; channelId: string }]
				>((params) => {
					const { sponsor, channelId } = params();
					return {
						render: () =>
							`<a href="/app/view/sponsor?sponsorId=${sponsor.sponsorId}&channelId=${channelId}" class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground">${sponsor.name}</a>`
					};
				});
				return renderSnippet(snippet, { sponsor: row.original.sponsor, channelId });
			}
		},
		{
			accessorKey: 'publishedAt',
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					title: 'Published',
					isSorted: column.getIsSorted(),
					onclick: column.getToggleSortingHandler()
				}),
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
		}
	];

	let sorting = $state<SortingState>([]);

	const table = createSvelteTable({
		get data() {
			return videos;
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
			<h2 class="text-lg font-semibold text-foreground">Recent Videos</h2>
			<Badge variant="secondary">{videos.length}</Badge>
		</div>
	</div>
	{#if videos.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-12"
		>
			<div class="rounded-full bg-muted p-3">
				<Video class="h-6 w-6 text-muted-foreground" />
			</div>
			<p class="mt-3 text-sm text-muted-foreground">No videos found for this channel</p>
		</div>
	{:else}
		<div class="overflow-hidden rounded-xl border border-border">
			<div class="max-h-[500px] overflow-y-auto">
				<Table.Root>
					<Table.Header class="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
						{#key sorting}
							{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
								<Table.Row class="hover:bg-transparent">
									{#each headerGroup.headers as header (header.id)}
										<Table.Head
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
									<Table.Cell class="py-2.5">
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
