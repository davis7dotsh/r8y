<script lang="ts">
	import { createRawSnippet } from 'svelte';
	import {
		renderComponent,
		renderSnippet,
		createSvelteTable,
		FlexRender
	} from '$lib/components/ui/data-table/index.js';
	import DataTableColumnHeader from '$lib/components/ui/data-table/data-table-column-header.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import ChannelHeader from '$lib/components/ChannelHeader.svelte';
	import {
		getCoreRowModel,
		getSortedRowModel,
		getFilteredRowModel,
		type ColumnDef,
		type SortingState
	} from '@tanstack/table-core';
	import { formatNumber, formatDate, formatDaysAgo } from '$lib/utils';
	import { Video, Users, Search } from '@lucide/svelte';
	import SponsorTable from './SponsorTable.svelte';

	let { data } = $props();

	const channelId = $derived(data.channelId);
	const channel = $derived(data.channel);
	const data2025 = $derived(data.data2025);

	let sponsorSearch = $state('');
	let videoSearch = $state('');

	type SponsorType = {
		sponsorId: string;
		name: string;
		videoCount: number;
		avgViews: number;
		daysAgo: number | null;
	};

	type VideoType = {
		ytVideoId: string;
		title: string;
		thumbnailUrl: string;
		viewCount: number;
		likeCount: number;
		publishedAt: Date;
		sponsor: { sponsorId: string; name: string } | null;
	};

	const sponsorColumns: ColumnDef<SponsorType>[] = [
		{
			accessorKey: 'name',
			header: 'Sponsor',
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ sponsor: SponsorType; channelId: string }]>(
					(params) => {
						const { sponsor, channelId } = params();
						return {
							render: () =>
								`<a href="/app/view/sponsor?sponsorId=${sponsor.sponsorId}&channelId=${channelId}" class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground">${sponsor.name}</a>`
						};
					}
				);
				return renderSnippet(snippet, { sponsor: row.original, channelId });
			}
		},
		{
			accessorKey: 'videoCount',
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					title: 'Videos',
					isSorted: column.getIsSorted(),
					onclick: column.getToggleSortingHandler()
				}),
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ count: number }]>((params) => {
					const { count } = params();
					return {
						render: () => `<span class="tabular-nums font-medium">${count}</span>`
					};
				});
				return renderSnippet(snippet, { count: row.original.videoCount });
			}
		},
		{
			accessorKey: 'avgViews',
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					title: 'Avg Views',
					isSorted: column.getIsSorted(),
					onclick: column.getToggleSortingHandler()
				}),
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ views: number }]>((params) => {
					const { views } = params();
					return {
						render: () => `<span class="tabular-nums font-medium">${formatNumber(views)}</span>`
					};
				});
				return renderSnippet(snippet, { views: row.original.avgViews });
			}
		},
		{
			accessorKey: 'daysAgo',
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					title: 'Last Video',
					isSorted: column.getIsSorted(),
					onclick: column.getToggleSortingHandler()
				}),
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ daysAgo: number | null }]>((params) => {
					const { daysAgo } = params();
					if (daysAgo === null) {
						return { render: () => `<span class="text-muted-foreground/50">—</span>` };
					}
					const isRecent = daysAgo <= 7;
					return {
						render: () =>
							`<span class="${isRecent ? 'text-primary font-medium' : 'text-foreground'}">${daysAgo} days ago</span>`
					};
				});
				return renderSnippet(snippet, { daysAgo: row.original.daysAgo });
			},
			sortingFn: (rowA, rowB) => {
				const a = rowA.original.daysAgo ?? Infinity;
				const b = rowB.original.daysAgo ?? Infinity;
				return a - b;
			}
		}
	];

	const videoColumns: ColumnDef<VideoType>[] = [
		{
			accessorKey: 'thumbnailUrl',
			header: '',
			size: 100,
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ video: VideoType; channelId: string }]>((params) => {
					const { video, channelId } = params();
					return {
						render: () =>
							`<a href="/app/view/video?videoId=${video.ytVideoId}&channelId=${channelId}" class="block"><img src="${video.thumbnailUrl}" alt="" class="h-14 w-24 rounded-lg object-cover transition-all hover:opacity-80 hover:ring-2 hover:ring-primary/50" /></a>`
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
							`<a href="/app/view/video?videoId=${video.ytVideoId}&channelId=${channelId}" class="block max-w-lg font-medium text-foreground transition-colors hover:text-primary line-clamp-2">${video.title}</a>`
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
						render: () => `<span class="tabular-nums font-medium">${formatNumber(views)}</span>`
					};
				});
				return renderSnippet(snippet, { views: row.original.viewCount });
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
						render: () => `<span class="tabular-nums font-medium">${formatNumber(likes)}</span>`
					};
				});
				return renderSnippet(snippet, { likes: row.original.likeCount });
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
				const snippet = createRawSnippet<[{ date: Date }]>((params) => {
					const { date } = params();
					const daysAgo = formatDaysAgo(date);
					const fullDate = formatDate(date);
					const isRecent = daysAgo === 'Today' || daysAgo === '1 day ago';
					return {
						render: () =>
							`<div class="flex flex-col"><span class="${isRecent ? 'text-primary font-medium' : 'text-foreground'}">${daysAgo}</span><span class="text-xs text-muted-foreground">${fullDate}</span></div>`
					};
				});
				return renderSnippet(snippet, { date: row.original.publishedAt });
			},
			sortingFn: 'datetime'
		}
	];

	let sponsorSorting = $state<SortingState>([{ id: 'videoCount', desc: true }]);
	let videoSorting = $state<SortingState>([{ id: 'publishedAt', desc: true }]);

	const sponsorTable = $derived(
		data2025
			? createSvelteTable({
					get data() {
						return (data2025?.sponsors ?? []) as SponsorType[];
					},
					columns: sponsorColumns,
					state: {
						get sorting() {
							return sponsorSorting;
						},
						get globalFilter() {
							return sponsorSearch;
						}
					},
					onSortingChange: (updater) => {
						if (typeof updater === 'function') {
							sponsorSorting = updater(sponsorSorting);
						} else {
							sponsorSorting = updater;
						}
					},
					onGlobalFilterChange: (updater) => {
						if (typeof updater === 'function') {
							sponsorSearch = updater(sponsorSearch);
						} else {
							sponsorSearch = updater;
						}
					},
					globalFilterFn: (row, _columnId, filterValue) => {
						const search = filterValue.toLowerCase();
						return row.original.name.toLowerCase().includes(search);
					},
					getCoreRowModel: getCoreRowModel(),
					getSortedRowModel: getSortedRowModel(),
					getFilteredRowModel: getFilteredRowModel()
				})
			: null
	);

	const videoTable = $derived(
		data2025
			? createSvelteTable({
					get data() {
						return (data2025?.videos ?? []) as VideoType[];
					},
					columns: videoColumns,
					state: {
						get sorting() {
							return videoSorting;
						},
						get globalFilter() {
							return videoSearch;
						}
					},
					onSortingChange: (updater) => {
						if (typeof updater === 'function') {
							videoSorting = updater(videoSorting);
						} else {
							videoSorting = updater;
						}
					},
					onGlobalFilterChange: (updater) => {
						if (typeof updater === 'function') {
							videoSearch = updater(videoSearch);
						} else {
							videoSearch = updater;
						}
					},
					globalFilterFn: (row, _columnId, filterValue) => {
						const search = filterValue.toLowerCase();
						return row.original.title.toLowerCase().includes(search);
					},
					getCoreRowModel: getCoreRowModel(),
					getSortedRowModel: getSortedRowModel(),
					getFilteredRowModel: getFilteredRowModel()
				})
			: null
	);
</script>

<svelte:head>
	<title>2025 Analytics{channel ? ` - ${channel.name}` : ''} - r8y 3.0</title>
	<meta name="description" content="View 2025 analytics for sponsors and videos." />
</svelte:head>

<div class="flex flex-col gap-6 p-8">
	{#if !channelId}
		<p class="text-muted-foreground">Please select a channel</p>
	{:else if data2025 && sponsorTable && videoTable}
		<ChannelHeader {channelId} channels={data.allChannels} />

		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<Breadcrumb.Root>
				<Breadcrumb.List>
					<Breadcrumb.Item>
						<Breadcrumb.Link href="/app">Channels</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator />
					<Breadcrumb.Item>
						<Breadcrumb.Link href={`/app/view/channel?channelId=${channelId}`}>
							{channel?.name ?? 'Channel'}
						</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator />
					<Breadcrumb.Item>
						<Breadcrumb.Page>2025 Analytics</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</div>

		<!-- Sponsors Section -->
		<svelte:boundary>
			{#snippet pending()}
				<div>loading sponsors...</div>
			{/snippet}

			{#snippet failed(e, r)}
				<div>error loading sponsors: {(e as Error).message}</div>
			{/snippet}

			<SponsorTable {channelId} />
		</svelte:boundary>

		<!-- Videos Section -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<h2 class="text-foreground text-lg font-semibold">Videos</h2>
					<Badge variant="secondary">{videoTable.getFilteredRowModel().rows.length} videos</Badge>
				</div>
				<div class="relative w-64">
					<Search class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
					<Input type="text" placeholder="Search videos..." class="pl-9" bind:value={videoSearch} />
				</div>
			</div>
			{#if data2025.videos.length === 0}
				<div
					class="border-border bg-muted/30 flex flex-col items-center justify-center rounded-xl border border-dashed p-12"
				>
					<div class="bg-muted rounded-full p-3">
						<Video class="text-muted-foreground h-6 w-6" />
					</div>
					<p class="text-muted-foreground mt-3 text-sm">No videos in 2025</p>
				</div>
			{:else}
				<div class="border-border max-h-[600px] overflow-auto rounded-xl border">
					<Table.Root>
						<Table.Header class="bg-muted/80 sticky top-0 z-10">
							{#key videoSorting}
								{#each videoTable.getHeaderGroups() as headerGroup (headerGroup.id)}
									<Table.Row class="hover:bg-transparent">
										{#each headerGroup.headers as header (header.id)}
											<Table.Head
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
							{#each videoTable.getRowModel().rows as row (row.id)}
								<Table.Row class="group">
									{#each row.getVisibleCells() as cell (cell.id)}
										<Table.Cell class="py-3">
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
			{/if}
		</div>
	{/if}
</div>
