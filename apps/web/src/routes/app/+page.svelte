<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import ChannelsList from '$lib/components/ChannelsList.svelte';
	import { Plus } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Channels - r8y 3.0</title>
	<meta
		name="description"
		content="View and manage all your YouTube channels in one place with detailed statistics and performance metrics."
	/>
</svelte:head>

<div class="p-8">
	<Breadcrumb.Root class="mb-6">
		<Breadcrumb.List>
			<Breadcrumb.Item>
				<Breadcrumb.Page>Channels</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>

	<div class="mb-8 flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold text-foreground">Channels</h1>
			<p class="mt-1 text-sm text-muted-foreground">Manage and view statistics for your channels</p>
		</div>
		<Button href="/app/channel/create" size="sm">
			<Plus class="h-4 w-4" />
			Add Channel
		</Button>
	</div>

	<svelte:boundary>
		{#snippet pending()}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each Array(3) as _}
					<div class="animate-pulse rounded-xl border border-border bg-card p-5">
						<div class="h-6 w-32 rounded bg-muted"></div>
						<div class="mt-2 h-4 w-48 rounded bg-muted"></div>
						<div class="mt-5 grid grid-cols-2 gap-3">
							<div class="h-24 rounded-lg bg-muted"></div>
							<div class="h-24 rounded-lg bg-muted"></div>
						</div>
						<div class="mt-4 h-20 rounded-lg bg-muted"></div>
					</div>
				{/each}
			</div>
		{/snippet}
		<ChannelsList />
	</svelte:boundary>
</div>
