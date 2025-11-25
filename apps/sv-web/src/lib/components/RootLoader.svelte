<script lang="ts">
	import { Spinner } from '$lib/components/ui/spinner/index.js';
</script>

<div class="fixed inset-0 flex items-center justify-center bg-background">
	<div class="flex flex-col items-center gap-4">
		<Spinner class="size-12 text-primary" />
		<p class="animate-pulse text-base font-medium text-muted-foreground">Loading...</p>
	</div>
</div>
