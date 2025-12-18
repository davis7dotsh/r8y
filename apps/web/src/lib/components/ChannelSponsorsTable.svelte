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
	import { Badge } from '$lib/components/ui/badge/index.js';
	import {
		getCoreRowModel,
		getSortedRowModel,
		type ColumnDef,
		type SortingState
	} from '@tanstack/table-core';
	import { formatNumber, formatDate } from '$lib/utils';
	import { Users } from '@lucide/svelte';
	import { remoteGetChannelSponsors } from '$lib/remote/channels.remote';

	type Sponsor = {
		sponsorId: string;
		name: string;
		sponsorKey: string;
		totalViews: number;
		totalVideos: number;
		avgViewsPerVideo: number;
		lastVideoPublishedAt: Date | string | number | null;
		lastVideoPublishedDaysAgo: number | null;
	};

	const { channelId }: { channelId: string } = $props();

	const sponsors = $derived(await remoteGetChannelSponsors(channelId));

	const columns: ColumnDef<Sponsor>[] = [
		{
			accessorKey: 'name',
			header: 'Sponsor',
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ sponsor: Sponsor; channelId: string }]>((params) => {
					const { sponsor, channelId } = params();
					return {
						render: () =>
							`<a href="/app/view/sponsor?sponsorId=${sponsor.sponsorId}&channelId=${channelId}" class="font-medium text-foreground hover:text-primary transition-colors">${sponsor.name}</a>`
					};
				});
				return renderSnippet(snippet, { sponsor: row.original, channelId });
			}
		},
		{
			accessorKey: 'sponsorKey',
			header: 'Key',
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ key: string }]>((params) => {
					const { key } = params();
					return {
						render: () => `<span class="font-mono text-xs text-muted-foreground">${key}</span>`
					};
				});
				return renderSnippet(snippet, { key: row.original.sponsorKey });
			}
		},
		{
			accessorKey: 'totalViews',
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					title: 'Total Views',
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
				return renderSnippet(snippet, { views: row.original.totalViews });
			}
		},
		{
			accessorKey: 'totalVideos',
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
						render: () => `<span class="tabular-nums">${count}</span>`
					};
				});
				return renderSnippet(snippet, { count: row.original.totalVideos });
			}
		},
		{
			accessorKey: 'avgViewsPerVideo',
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					title: 'Avg Views',
					isSorted: column.getIsSorted(),
					onclick: column.getToggleSortingHandler()
				}),
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ avg: number }]>((params) => {
					const { avg } = params();
					return {
						render: () => `<span class="tabular-nums">${formatNumber(avg)}</span>`
					};
				});
				return renderSnippet(snippet, { avg: row.original.avgViewsPerVideo });
			}
		},
		{
			accessorKey: 'lastVideoPublishedAt',
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					title: 'Last Published',
					isSorted: column.getIsSorted(),
					onclick: column.getToggleSortingHandler()
				}),
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ date: Date | string | null }]>((params) => {
					const { date } = params();
					if (!date) return { render: () => `<span class="text-muted-foreground/50">Never</span>` };
					return {
						render: () => `<span class="text-muted-foreground">${formatDate(date)}</span>`
					};
				});
				const { lastVideoPublishedAt } = row.original;
				const dateProp = lastVideoPublishedAt ? new Date(lastVideoPublishedAt) : null;
				return renderSnippet(snippet, { date: dateProp });
			},
			sortingFn: 'datetime'
		},
		{
			accessorKey: 'lastVideoPublishedDaysAgo',
			header: 'Days Ago',
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ daysAgo: number | null }]>((params) => {
					const { daysAgo } = params();
					if (daysAgo === null)
						return { render: () => `<span class="text-muted-foreground/50">—</span>` };
					const color =
						daysAgo <= 7
							? 'text-primary'
							: daysAgo <= 30
								? 'text-foreground'
								: 'text-muted-foreground';
					return {
						render: () => `<span class="tabular-nums ${color}">${daysAgo}d</span>`
					};
				});
				return renderSnippet(snippet, { daysAgo: row.original.lastVideoPublishedDaysAgo });
			}
		}
	];

	let sorting = $state<SortingState>([]);

	const table = createSvelteTable({
		get data() {
			return sponsors;
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
			<h2 class="text-lg font-semibold text-foreground">Sponsors</h2>
			<Badge variant="secondary">{sponsors.length}</Badge>
		</div>
	</div>
	{#if sponsors.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-12"
		>
			<div class="rounded-full bg-muted p-3">
				<Users class="h-6 w-6 text-muted-foreground" />
			</div>
			<p class="mt-3 text-sm text-muted-foreground">No sponsors found for this channel</p>
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
									<Table.Cell class="py-3">
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
