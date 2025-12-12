import { pgTable, text, timestamp, uuid, integer, real, boolean, jsonb } from 'drizzle-orm/pg-core';
import { campaigns } from './campaigns.js';
import { actors } from './actors.js';

export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id').references(() => actors.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  itemType: text('item_type').notNull(),
  img: text('img'),
  // Core properties
  description: text('description'),
  quantity: integer('quantity').notNull().default(1),
  weight: real('weight').notNull().default(0),
  price: real('price').notNull().default(0),
  equipped: boolean('equipped').notNull().default(false),
  // Item template system
  templateId: text('template_id'),
  identified: boolean('identified').notNull().default(true),
  attunement: text('attunement'),
  rarity: text('rarity'),
  containerId: uuid('container_id').references((): any => items.id, { onDelete: 'set null' }),
  // Metadata
  data: jsonb('data').notNull().default({}),
  sort: integer('sort').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
