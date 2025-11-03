<script lang="ts">
	import { page } from '$app/state';
	import ErrorDisplay from '$lib/app/ErrorDisplay.svelte';

	const error = $derived(page.error?.message ?? 'Unknown error');
</script>

<ErrorDisplay message={error} />
