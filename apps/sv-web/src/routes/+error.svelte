<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { ArrowRight } from '@lucide/svelte';

	const message = $derived(page.error?.message ?? 'Unknown error');
</script>

<div class="flex h-screen flex-col items-start justify-center gap-4">
	<h1 class="text-2xl font-bold">Something went wrong...</h1>
	<p class="text-lg">{message}</p>
	<div class="flex gap-2">
		<Button href="/" variant="outline">Home <ArrowRight></ArrowRight></Button>
		<Button href="/app" variant="outline">App <ArrowRight></ArrowRight></Button>
	</div>
</div>
