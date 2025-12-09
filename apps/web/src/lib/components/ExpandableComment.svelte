<script lang="ts">
	import type { Attachment } from 'svelte/attachments';

	let { text }: { text: string } = $props();

	let expanded = $state(false);
	let isOverflowing = $state(false);

	const overflowDetector: Attachment = (node) => {
		const check = () => {
			// scrollWidth > clientWidth means text is truncated horizontally
			isOverflowing = node.scrollWidth > node.clientWidth;
		};

		check();
		const ro = new ResizeObserver(check);
		ro.observe(node);

		return () => ro.disconnect();
	};
</script>

<div class="min-w-0">
	<button
		type="button"
		class="block w-full rounded-sm text-left text-sm wrap-break-word text-foreground transition-colors {isOverflowing ||
		expanded
			? 'cursor-pointer hover:bg-muted'
			: ''}"
		onclick={() => {
			if (isOverflowing || expanded) expanded = !expanded;
		}}
	>
		<span
			{@attach overflowDetector}
			class={expanded ? 'block whitespace-normal' : 'block truncate'}
		>
			{text}
		</span>
	</button>
	{#if expanded}
		<button
			type="button"
			class="mt-1 text-xs text-muted-foreground transition-colors hover:text-primary"
			onclick={() => (expanded = false)}
		>
			Show less
		</button>
	{/if}
</div>
