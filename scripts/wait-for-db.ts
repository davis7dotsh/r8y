import { $ } from 'bun';

const MAX_RETRIES = 30;
const RETRY_INTERVAL = 1000;

async function waitForDb() {
	console.log('Waiting for MySQL to be ready...');

	for (let i = 0; i < MAX_RETRIES; i++) {
		try {
			await $`docker compose exec -T mysql mysqladmin ping -h localhost --silent`.quiet();
			console.log('MySQL is ready!');
			return;
		} catch {
			process.stdout.write('.');
			await Bun.sleep(RETRY_INTERVAL);
		}
	}

	console.error('\nMySQL failed to start within timeout');
	process.exit(1);
}

await waitForDb();
