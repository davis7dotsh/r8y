<script lang="ts">
	import { getAppStore } from '$lib/app/AppStore.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { remoteCreateChannel } from '$lib/remote/channels.remote';

	const appStore = getAppStore();
	let isCreating = $state(false);

	const { channelName, findSponsorPrompt, ytChannelId } = remoteCreateChannel.fields;
</script>

<form
	{...remoteCreateChannel.enhance(async ({ form, submit, data }) => {
		try {
			isCreating = true;
			await submit();
			form.reset();
			await new Promise((r) => setTimeout(r, 300));
			await appStore.refreshChannels();
			appStore.selectedChannelId = data.ytChannelId;
		} catch (error) {
			console.error(error);
		} finally {
			isCreating = false;
		}
	})}
	class="flex w-64 flex-col gap-6"
>
	<h2 class="text-2xl font-bold">Create Channel</h2>
	<div class="flex flex-col gap-2">
		<Label class="flex flex-col items-start gap-2">
			Channel Name
			<Input {...channelName.as('text')} placeholder="my channel" />
		</Label>
	</div>
	<div class="flex flex-col gap-2">
		<Label class="flex flex-col items-start gap-2">
			YouTube Channel ID
			<Input {...ytChannelId.as('text')} placeholder="UC_XXXXXXXXXXXXXXXXXX" />
		</Label>
	</div>
	<div class="flex flex-col gap-2">
		<Label class="flex flex-col items-start gap-2">
			Find Sponsor Prompt
			<Textarea
				{...findSponsorPrompt.as('text')}
				placeholder="include details on how to get the sponsor key & name"
			/>
		</Label>
	</div>
	<Button type="submit" disabled={isCreating}>
		{#if isCreating}
			<Spinner />
		{:else}
			Create Channel
		{/if}
	</Button>
</form>
