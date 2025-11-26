import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'mysql',
	schema: './src/schema.ts',
	dbCredentials: {
		url: process.env.MYSQL_URL!
	}
});
