import { DB_SCHEMA } from '@r8y/db';
import { dbClient } from './db';

const main = async () => {
	const prompt = 'This will wipe DB tables. Type "yes" to continue: ';
	const input = await new Promise((res) => {
		process.stdout.write(prompt);
		let data = '';
		process.stdin.on('data', (chunk) => {
			data += chunk.toString();
			if (data.endsWith('\n')) {
				res(data.trim());
			}
		});
	});
	if (input !== 'yes') {
		console.log('Aborted.');
		process.exit(0);
	}

	console.log('Wiping DB tables...');
	await dbClient.delete(DB_SCHEMA.sponsorToVideos);
	console.log('Wiped sponsorToVideos');
	await dbClient.delete(DB_SCHEMA.sponsors);
	console.log('Wiped sponsors');
	await dbClient.delete(DB_SCHEMA.videos);
	console.log('Wiped videos');
	await dbClient.delete(DB_SCHEMA.comments);
	console.log('Wiped comments');
	await dbClient.delete(DB_SCHEMA.notifications);
	console.log('Wiped notifications');
	console.log('DB tables wiped successfully');
};

main();
