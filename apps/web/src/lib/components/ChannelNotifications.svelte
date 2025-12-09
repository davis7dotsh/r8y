<script lang="ts">
	import { remoteGetChannelNotifications } from '$lib/remote/channels.remote';
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
	import { formatRelativeTime } from '$lib/utils';
	import { Bell } from '@lucide/svelte';

	const { channelId }: { channelId: string } = $props();

	const notifications = $derived(await remoteGetChannelNotifications(channelId));

	const getNotificationTypeLabel = (type: string) => {
		return type
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	type Notification = (typeof notifications)[number];

	const columns: ColumnDef<Notification>[] = [
		{
			accessorKey: 'type',
			header: 'Type',
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ type: string }]>((params) => {
					const { type } = params();
					const label = getNotificationTypeLabel(type);
					return {
						render: () =>
							`<span class="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">${label}</span>`
					};
				});
				return renderSnippet(snippet, { type: row.original.type });
			}
		},
		{
			accessorKey: 'success',
			header: 'Status',
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ success: boolean }]>((params) => {
					const { success } = params();
					if (success) {
						return {
							render: () =>
								`<span class="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">Success</span>`
						};
					}
					return {
						render: () =>
							`<span class="inline-flex items-center rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">Failed</span>`
					};
				});
				return renderSnippet(snippet, { success: row.original.success });
			}
		},
		{
			accessorKey: 'message',
			header: 'Message',
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ message: string }]>((params) => {
					const { message } = params();
					return {
						render: () =>
							`<span class="text-sm text-foreground max-w-md truncate block">${message}</span>`
					};
				});
				return renderSnippet(snippet, { message: row.original.message });
			}
		},
		{
			accessorKey: 'videoTitle',
			header: 'Video',
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ title: string }]>((params) => {
					const { title } = params();
					return {
						render: () =>
							`<span class="text-sm text-muted-foreground max-w-xs truncate block">${title}</span>`
					};
				});
				return renderSnippet(snippet, { title: row.original.videoTitle });
			}
		},
		{
			accessorKey: 'createdAt',
			header: ({ column }) =>
				renderComponent(DataTableColumnHeader, {
					title: 'Time',
					isSorted: column.getIsSorted(),
					onclick: column.getToggleSortingHandler()
				}),
			cell: ({ row }) => {
				const snippet = createRawSnippet<[{ date: Date }]>((params) => {
					const { date } = params();
					return {
						render: () =>
							`<span class="text-sm text-muted-foreground">${formatRelativeTime(date)}</span>`
					};
				});
				return renderSnippet(snippet, { date: row.original.createdAt });
			},
			sortingFn: 'datetime'
		}
	];

	let sorting = $state<SortingState>([{ id: 'createdAt', desc: true }]);

	const table = createSvelteTable({
		get data() {
			return notifications;
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
			<h2 class="text-lg font-semibold text-foreground">Notifications</h2>
			<Badge variant="secondary">{notifications.length}</Badge>
		</div>
	</div>
	{#if notifications.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-12"
		>
			<div class="rounded-full bg-muted p-3">
				<Bell class="h-6 w-6 text-muted-foreground" />
			</div>
			<p class="mt-3 text-sm text-muted-foreground">No notifications yet</p>
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
