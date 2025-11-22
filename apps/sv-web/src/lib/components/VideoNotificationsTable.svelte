<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';

	const {
		videoData
	}: {
		videoData: Awaited<
			ReturnType<typeof import('$lib/remote/channels.remote').remoteGetVideoDetails>
		>;
	} = $props();

	const formatRelativeTime = (date: Date) => {
		const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

		if (seconds < 60) return 'just now';
		if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
		if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	const getNotificationTypeLabel = (type: string) => {
		return type
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};
</script>

<div>
	<h2 class="mb-4 text-xl font-semibold text-foreground">Sent Notifications</h2>
	{#if !videoData.notifications || videoData.notifications.length === 0}
		<div class="rounded-lg border border-border bg-muted p-8">
			<p class="text-center text-muted-foreground">No notifications found</p>
		</div>
	{:else}
		<div class="overflow-hidden rounded-lg border border-border bg-card">
			<table class="w-full">
				<thead class="border-b border-border bg-muted">
					<tr>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
						>
							Type
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
						>
							Status
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
						>
							Message
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
						>
							Time
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each videoData.notifications as notification}
						<tr class="hover:bg-muted/50">
							<td class="px-6 py-4">
								<Badge variant="secondary">
									{getNotificationTypeLabel(notification.type)}
								</Badge>
							</td>
							<td class="px-6 py-4">
								<Badge variant={notification.success ? 'default' : 'destructive'}>
									{notification.success ? 'Success' : 'Failed'}
								</Badge>
							</td>
							<td class="px-6 py-4">
								<p class="max-w-md text-sm text-card-foreground">{notification.message}</p>
							</td>
							<td class="px-6 py-4 text-sm text-muted-foreground">
								{formatRelativeTime(notification.createdAt)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
