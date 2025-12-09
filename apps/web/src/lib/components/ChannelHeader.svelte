<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { ChevronDown, Check } from '@lucide/svelte';
	import { remoteGetAllChannels } from '$lib/remote/channels.remote';

	const { channelId } = $props<{ channelId: string }>();

	const channels = $derived(await remoteGetAllChannels());

	const selectedChannel = $derived(channels?.find((channel) => channel.ytChannelId === channelId));
</script>

<div class="flex items-center gap-4">
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
		>
			<span class="max-w-[200px] truncate">{selectedChannel?.name ?? 'Select Channel'}</span>
			<ChevronDown class="h-4 w-4 opacity-50" />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="min-w-[200px]" align="start">
			<DropdownMenu.Group>
				<DropdownMenu.GroupHeading>Switch Channel</DropdownMenu.GroupHeading>
				{#each channels as channel}
					<DropdownMenu.Item class="cursor-pointer">
						<a
							href={`/app/view/channel?channelId=${channel.ytChannelId}`}
							class="flex w-full items-center justify-between"
						>
							<span class="truncate">{channel.name}</span>
							{#if channelId === channel.ytChannelId}
								<Check class="h-4 w-4 text-primary" />
							{/if}
						</a>
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
