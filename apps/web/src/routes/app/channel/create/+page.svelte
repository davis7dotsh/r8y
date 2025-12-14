<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Spinner from '$lib/components/ui/spinner/spinner.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';

	let { form } = $props();

	let isCreating = $state(false);
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
		method="POST"
		class="flex w-96 flex-col gap-6"
		use:enhance={() => {
			isCreating = true;
			return async ({ update }) => {
				await update();
				isCreating = false;
			};
		}}
	>
		<h2 class="text-2xl font-bold">Create Channel</h2>
		{#if form?.error}
			<p class="text-sm text-destructive">{form.error}</p>
		{/if}
		<div class="flex flex-col gap-2">
			<Label class="flex flex-col items-start gap-2">
				Channel Name
				<Input
					type="text"
					name="channelName"
					placeholder="my channel"
					value={form?.channelName ?? ''}
				/>
			</Label>
		</div>
		<div class="flex flex-col gap-2">
			<Label class="flex flex-col items-start gap-2">
				YouTube Channel ID
				<Input
					type="text"
					name="ytChannelId"
					placeholder="UC_XXXXXXXXXXXXXXXXXX"
					value={form?.ytChannelId ?? ''}
				/>
			</Label>
		</div>
		<div class="flex flex-col gap-2">
			<Label class="flex flex-col items-start gap-2">
				Find Sponsor Prompt
				<Textarea
					name="findSponsorPrompt"
					placeholder="include details on how to get the sponsor key & name"
					value={form?.findSponsorPrompt ?? ''}
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
