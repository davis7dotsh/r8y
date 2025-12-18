import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/schema.ts',
	dbCredentials: {
		url: process.env.DATABASE_URL!
	}
});
