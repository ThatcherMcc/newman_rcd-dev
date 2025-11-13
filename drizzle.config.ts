import { defineConfig } from "drizzle-kit";
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

export default defineConfig({
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    dialect: 'postgresql',
    schema: './src/lib/db/schema.ts',
    out: './src/lib/db/migrations'
})