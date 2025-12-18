<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	onMount(() => {
		const channelId = page.url.searchParams.get('channelId');
		const redirectUrl = channelId
			? `/app/view/channel/overview?channelId=${channelId}`
			: '/app/view/channel/overview';
		goto(redirectUrl, { replaceState: true });
	});
</script>

<div class="p-8">
	<p class="text-muted-foreground">Redirecting...</p>
</div>
