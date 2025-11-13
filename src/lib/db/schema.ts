import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const justBecause = pgTable('just_because', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type JustBecause = typeof justBecause.$inferSelect;
export type JustBecauseInsert = typeof justBecause.$inferInsert;