<script lang="ts">
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';

	let {
		title,
		isSorted = false,
		onclick
	}: {
		title: string;
		isSorted?: false | 'asc' | 'desc';
		onclick?: ((event: MouseEvent) => void) | undefined;
	} = $props();
</script>

<button
	type="button"
	class="flex items-center gap-1.5 transition-colors hover:text-foreground"
	{onclick}
>
	<span>{title}</span>
	{#if isSorted === 'asc'}
		<ArrowUpIcon class="h-4 w-4" />
	{:else if isSorted === 'desc'}
		<ArrowDownIcon class="h-4 w-4" />
	{:else}
		<ArrowUpDownIcon class="h-3.5 w-3.5 opacity-50" />
	{/if}
</button>
