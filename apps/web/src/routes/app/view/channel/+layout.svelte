<script lang="ts">
	import AppBreadcrumb from '$lib/components/AppBreadcrumb.svelte';
	import { Button } from '$lib/components/ui/button';
	import z from 'zod';
	import { useSearchParams } from 'runed/kit';
	import { page } from '$app/state';

	const paramsSchema = z.object({
		channelId: z.string().default('')
	});

	const searchParams = useSearchParams(paramsSchema);
	const channelId = $derived(searchParams.channelId);

	const currentPath = $derived(page.url.pathname);
	const basePath = $derived(`/app/view/channel`);

	const tabs = [
		{ label: 'Overview', path: 'overview' },
		{ label: 'Last 7 Videos', path: 'last7days' },
		{ label: 'Sponsors', path: 'sponsors' }
	] as const;

	const isActive = (tabPath: string) => {
		return currentPath.endsWith(`/${tabPath}`);
	};

	type LayoutProps = { children: import('svelte').Snippet };
	const { children }: LayoutProps = $props();
</script>

<svelte:head>
	<title>Channel - r8y 3.0</title>
	<meta
		name="description"
		content="View detailed analytics, recent videos, sponsors, and notifications."
	/>
</svelte:head>

<div class="flex flex-col gap-6 p-8">
	{#if !channelId}
		<p class="text-muted-foreground">Please select a channel</p>
	{:else}
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<AppBreadcrumb items={[{ type: 'channel', channelId }]} />

			<div class="flex items-center gap-4">
				<div
					class="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]"
				>
					{#each tabs as tab}
						<a
							href="{basePath}/{tab.path}?channelId={channelId}"
							class="text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 {isActive(
								tab.path
							)
								? 'bg-background dark:border-input dark:bg-input/30 dark:text-foreground shadow-sm'
								: 'dark:text-muted-foreground'}"
						>
							{tab.label}
						</a>
					{/each}
				</div>
				<Button href={`/app/view/2025?channelId=${channelId}`} variant="outline">
					2025 Analytics
				</Button>
			</div>
		</div>

		{@render children()}
	{/if}
</div>
