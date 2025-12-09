<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { formatRelativeTime } from '$lib/utils';
	import { Bell } from '@lucide/svelte';

	const {
		videoData
	}: {
		videoData: Awaited<
			ReturnType<typeof import('$lib/remote/channels.remote').remoteGetVideoDetails>
		>;
	} = $props();

	const getNotificationTypeLabel = (type: string) => {
		return type
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<h2 class="text-lg font-semibold text-foreground">Notifications</h2>
			<Badge variant="secondary">{videoData.notifications?.length ?? 0}</Badge>
		</div>
	</div>
	{#if !videoData.notifications || videoData.notifications.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-8"
		>
			<div class="rounded-full bg-muted p-3">
				<Bell class="h-5 w-5 text-muted-foreground" />
			</div>
			<p class="mt-3 text-sm text-muted-foreground">No notifications sent for this video</p>
		</div>
	{:else}
		<div class="overflow-hidden rounded-xl border border-border">
			<Table.Root>
				<Table.Header class="bg-muted/80">
					<Table.Row class="hover:bg-transparent">
						<Table.Head
							class="h-11 text-xs font-medium tracking-wide text-muted-foreground uppercase"
							>Type</Table.Head
						>
						<Table.Head
							class="h-11 text-xs font-medium tracking-wide text-muted-foreground uppercase"
							>Status</Table.Head
						>
						<Table.Head
							class="h-11 text-xs font-medium tracking-wide text-muted-foreground uppercase"
							>Message</Table.Head
						>
						<Table.Head
							class="h-11 text-xs font-medium tracking-wide text-muted-foreground uppercase"
							>Time</Table.Head
						>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each videoData.notifications as notification}
						<Table.Row>
							<Table.Cell class="py-3">
								<span
									class="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
								>
									{getNotificationTypeLabel(notification.type)}
								</span>
							</Table.Cell>
							<Table.Cell class="py-3">
								{#if notification.success}
									<span
										class="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
										>Success</span
									>
								{:else}
									<span
										class="inline-flex items-center rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive"
										>Failed</span
									>
								{/if}
							</Table.Cell>
							<Table.Cell class="py-3">
								<span class="block max-w-md truncate text-sm text-foreground"
									>{notification.message}</span
								>
							</Table.Cell>
							<Table.Cell class="py-3">
								<span class="text-sm text-muted-foreground"
									>{formatRelativeTime(notification.createdAt)}</span
								>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
