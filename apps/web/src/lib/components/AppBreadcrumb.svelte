<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { remoteGetChannel } from '$lib/remote/channels.remote';

	type BreadcrumbItem =
		| { type: 'link'; label: string; href: string }
		| { type: 'page'; label: string; class?: string }
		| { type: 'channel'; channelId: string; isLink?: boolean };

	const { items }: { items: BreadcrumbItem[] } = $props();
</script>

<Breadcrumb.Root>
	<Breadcrumb.List>
		<Breadcrumb.Item>
			<Breadcrumb.Link href="/app">Channels</Breadcrumb.Link>
		</Breadcrumb.Item>
		{#each items as item}
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				{#if item.type === 'link'}
					<Breadcrumb.Link href={item.href}>{item.label}</Breadcrumb.Link>
				{:else if item.type === 'page'}
					<Breadcrumb.Page class={item.class}>{item.label}</Breadcrumb.Page>
				{:else if item.type === 'channel'}
					<svelte:boundary>
						{#snippet pending()}
							<span class="text-muted-foreground">Loading...</span>
						{/snippet}
						{#snippet failed()}
							<span class="text-destructive">Error</span>
						{/snippet}
						{#if item.isLink}
							<Breadcrumb.Link href="/app/view/channel/overview?channelId={item.channelId}">
								{(await remoteGetChannel(item.channelId)).name}
							</Breadcrumb.Link>
						{:else}
							<Breadcrumb.Page>{(await remoteGetChannel(item.channelId)).name}</Breadcrumb.Page>
						{/if}
					</svelte:boundary>
				{/if}
			</Breadcrumb.Item>
		{/each}
	</Breadcrumb.List>
</Breadcrumb.Root>
