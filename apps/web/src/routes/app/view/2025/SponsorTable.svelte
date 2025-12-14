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
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		getCoreRowModel,
		getSortedRowModel,
		getFilteredRowModel,
		type ColumnDef,
		type SortingState
	} from '@tanstack/table-core';
	import { formatNumber } from '$lib/utils';
	import { Users, Search } from '@lucide/svelte';
	import { remoteGet2025Sponsors } from '$lib/remote/channels.remote';

	const { channelId }: { channelId: string } = $props();

	const sponsors = $derived(await remoteGet2025Sponsors(channelId));

	type SponsorType = {
		sponsorId: string;
		name: string;
		videoCount: number;
		avgViews: number;
		daysAgo: number | null;
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

	let sponsorSorting = $state<SortingState>([{ id: 'videoCount', desc: true }]);
	let sponsorSearch = $state('');

	const sponsorTable = $derived(
		createSvelteTable({
			get data() {
				return (sponsors ?? []) as SponsorType[];
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
	);
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<h2 class="text-foreground text-lg font-semibold">Sponsors</h2>
			<Badge variant="secondary">{sponsorTable.getFilteredRowModel().rows.length} sponsors</Badge>
		</div>
		<div class="relative w-64">
			<Search class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
			<Input type="text" placeholder="Search sponsors..." class="pl-9" bind:value={sponsorSearch} />
		</div>
	</div>
	{#if sponsors.length === 0}
		<div
			class="border-border bg-muted/30 flex flex-col items-center justify-center rounded-xl border border-dashed p-12"
		>
			<div class="bg-muted rounded-full p-3">
				<Users class="text-muted-foreground h-6 w-6" />
			</div>
			<p class="text-muted-foreground mt-3 text-sm">No sponsors with videos in 2025</p>
		</div>
	{:else}
		<div class="border-border max-h-96 overflow-auto rounded-xl border">
			<Table.Root>
				<Table.Header class="bg-muted/80 sticky top-0 z-10">
					{#key sponsorSorting}
						{#each sponsorTable.getHeaderGroups() as headerGroup (headerGroup.id)}
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
					{#each sponsorTable.getRowModel().rows as row (row.id)}
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
	{/if}
</div>
