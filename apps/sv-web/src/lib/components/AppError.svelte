<script lang="ts">
	import { isHttpError } from '@sveltejs/kit';
	import { Button } from './ui/button';

	const { err, retryFn }: { err: unknown; retryFn?: () => void } = $props();

	const details = $derived.by((): App.Error & { status: number } => {
		console.error(err);
		if (!isHttpError(err)) return { type: 'unknown', message: 'Unknown error', status: 500 };
		return {
			type: err.body.type,
			message: err.body.message,
			status: err.status
		};
	});

	$effect(() => {
		console.error('APP ERROR:', details.status, details.type, details.message);
		console.error(details.cause);
	});
</script>

<div class="flex h-full flex-col items-center justify-center gap-4">
	<h1 class="text-2xl font-bold">ERROR | {details.status}</h1>
	<p class="text-lg font-light text-muted-foreground">{details.message}</p>
	{#if details.type === 'auth'}
		<Button href="/">Go Home</Button>
	{:else if details.type === 'db'}
		<Button onclick={retryFn}>Retry</Button>
	{:else if details.type === 'unknown'}
		<Button onclick={retryFn}>Retry</Button>
	{/if}
</div>
