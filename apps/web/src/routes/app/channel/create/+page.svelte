<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { remoteCreateChannel } from '$lib/remote/channels.remote';

	let isCreating = $state(false);

	const { channelName, findSponsorPrompt, ytChannelId } = remoteCreateChannel.fields;
</script>

<svelte:head>
	<title>Create Channel - r8y 3.0</title>
	<meta
		name="description"
		content="Add a new YouTube channel to track analytics, sponsors, and video performance."
	/>
</svelte:head>

<div class="flex h-full w-full flex-col items-center justify-center gap-4 p-8">
	<form
		{...remoteCreateChannel.enhance(async ({ form, submit, data }) => {
			try {
				isCreating = true;
				await submit();
				form.reset();
				await goto(`/app/view/channel?channelId=${data.ytChannelId}`);
			} catch (error) {
				console.error(error);
			} finally {
				isCreating = false;
			}
		})}
		class="flex w-96 flex-col gap-6"
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
</div>
