async function waitForDb() {
	console.log('Waiting for MySQL to be ready...');

	await Bun.sleep(3000);

	process.exit(0);
}

await waitForDb();

export { waitForDb };