import { pgTable, text, timestamp, uuid, boolean, jsonb } from 'drizzle-orm/pg-core';
import { games } from './games';
import { users } from './users';

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameId: uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  // Content
  content: text('content').notNull(),
  messageType: text('message_type').notNull().default('chat'),
  speaker: jsonb('speaker'),
  // Roll data (if messageType = 'roll')
  rollData: jsonb('roll_data'),
  // Whisper targets
  whisperTargets: jsonb('whisper_targets'),
  blind: boolean('blind').notNull().default(false),
  // Metadata
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  data: jsonb('data').notNull().default({}),
});
