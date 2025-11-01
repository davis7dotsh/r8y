<script lang="ts">
	import logo from '$lib/assets/favicon.svg';
	import { remoteDemo } from '$lib/demo.remote';

	const { channels } = await remoteDemo();
</script>

<main class="flex grow flex-col items-center justify-center gap-4">
	<div class="flex flex-row items-center justify-center gap-2">
		<img src={logo} alt="Logo" class="h-24 w-24" />
		<h2 class="text-3xl font-bold"><span class="text-primary">SvelteKit</span> App</h2>
	</div>
	<p class="text-center text-lg text-neutral-500">Welcome to your new SvelteKit project.</p>
	{#each channels as channel}
		<div class="flex flex-row items-center justify-center gap-2">
			<p>{channel.name}</p>
		</div>
	{/each}
</main>
