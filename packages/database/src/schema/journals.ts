import { pgTable, text, timestamp, uuid, integer, jsonb, boolean } from 'drizzle-orm/pg-core';
import { campaigns } from './campaigns.js';
import { users } from './users.js';

export const folders = pgTable('folders', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  folderType: text('folder_type').notNull(),
  parentId: uuid('parent_id').references((): any => folders.id, { onDelete: 'cascade' }),
  color: text('color'),
  sort: integer('sort').notNull().default(0),
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const journals = pgTable('journals', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  img: text('img'),
  folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }),
  permission: text('permission').notNull().default('observer'),
  ownerId: uuid('owner_id').references(() => users.id),
  sort: integer('sort').notNull().default(0),
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const journalPages = pgTable('journal_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  journalId: uuid('journal_id').notNull().references(() => journals.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  pageType: text('page_type').notNull().default('text'),
  content: text('content'),
  src: text('src'),
  sort: integer('sort').notNull().default(0),
  showInNavigation: boolean('show_in_navigation').notNull().default(true),
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
