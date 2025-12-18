<script lang="ts">
	const { children } = $props();
</script>

<div class="flex flex-col gap-6 p-8">
	{@render children()}
</div>
