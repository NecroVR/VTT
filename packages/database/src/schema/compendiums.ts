import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { games } from './games.js';
import { sql } from 'drizzle-orm';

/**
 * Compendiums table
 * Stores collections of game content (Monster Manual, Spell Book, etc.)
 */
export const compendiums = pgTable('compendiums', {
  id: uuid('id').primaryKey().defaultRandom(),
  // null gameId = system-wide compendium available to all games
  gameId: uuid('game_id').references(() => games.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  label: text('label').notNull(),
  // Entity type this compendium holds: Actor, Item, JournalEntry, Scene
  entityType: text('entity_type').notNull(),
  // Game system: dnd5e, pf2e, etc.
  system: text('system'),
  // For imported packages
  packageId: text('package_id'),
  // Locked compendiums cannot be modified
  locked: boolean('locked').notNull().default(false),
  // Private compendiums are only visible to the game owner
  private: boolean('private').notNull().default(false),
  // Additional metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Compendium entries table
 * Stores individual items within a compendium pack
 */
export const compendiumEntries = pgTable('compendium_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  compendiumId: uuid('compendium_id').notNull().references(() => compendiums.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  img: text('img'),
  // Entity type must match parent compendium
  entityType: text('entity_type').notNull(),
  // Full entity data (Actor, Item, JournalEntry, or Scene data)
  entityData: jsonb('entity_data').notNull(),
  // Organization
  folderId: uuid('folder_id'),
  sort: integer('sort').notNull().default(0),
  // Full-text search field - generated from name + entity data
  searchText: text('search_text'),
  // Tags for filtering
  tags: text('tags').array(),
  // Additional metadata
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Full-text search index
  searchIdx: index('idx_compendium_entries_search').using(
    'gin',
    sql`to_tsvector('english', ${table.searchText})`
  ),
  // Index on compendium for faster lookups
  compendiumIdx: index('idx_compendium_entries_compendium').on(table.compendiumId),
}));
