import { pgTable, text, timestamp, uuid, bigint } from 'drizzle-orm/pg-core';

export const STORAGE_QUOTAS = {
  basic: 100 * 1024 * 1024,      // 100MB
  gm: 2 * 1024 * 1024 * 1024,    // 2GB
} as const;

export type AccountTier = keyof typeof STORAGE_QUOTAS;

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  username: text('username').notNull(),
  passwordHash: text('password_hash'),
  accountTier: text('account_tier').notNull().default('basic'),
  storageQuotaBytes: bigint('storage_quota_bytes', { mode: 'number' }).notNull().default(104857600),
  storageUsedBytes: bigint('storage_used_bytes', { mode: 'number' }).notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
