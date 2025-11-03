<script lang="ts">
	import { remoteGetAllChannels } from '$lib/remote/channels.remote';

	const channels = await remoteGetAllChannels();
</script>

<div>
	{#each channels as channel}
		<div>
			<h2>{channel.name}</h2>
			<p>{channel.ytChannelId}</p>
			<p>{channel.findSponsorPrompt}</p>
		</div>
	{/each}
</div>
