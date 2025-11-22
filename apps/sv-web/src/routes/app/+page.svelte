<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import ChannelsList from '$lib/components/ChannelsList.svelte';
</script>

<div class="p-8">
	<div class="mb-6">
		<Breadcrumb.Root>
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Page>Channels</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-foreground">Channels</h1>
			<p class="mt-2 text-sm text-muted-foreground">Manage and view statistics for your channels</p>
		</div>
		<Button href="/app/channel/create">+ Add Channel</Button>
	</div>

	<ChannelsList />
</div>
