import { describe, it, expect } from 'vitest';
import { getTableColumns, getTableName } from 'drizzle-orm';
import { chatMessages } from './chatMessages.js';

describe('chatMessages schema', () => {
  describe('table structure', () => {
    it('should have correct table name', () => {
      const tableName = getTableName(chatMessages);
      expect(tableName).toBe('chat_messages');
    });

    it('should have all required columns', () => {
      const columns = getTableColumns(chatMessages);
      expect(columns.id).toBeDefined();
      expect(columns.gameId).toBeDefined();
      expect(columns.userId).toBeDefined();
      expect(columns.content).toBeDefined();
      expect(columns.messageType).toBeDefined();
      expect(columns.timestamp).toBeDefined();
    });

    it('should have message content columns', () => {
      const columns = getTableColumns(chatMessages);
      expect(columns.speaker).toBeDefined();
      expect(columns.rollData).toBeDefined();
    });

    it('should have whisper columns', () => {
      const columns = getTableColumns(chatMessages);
      expect(columns.whisperTargets).toBeDefined();
      expect(columns.blind).toBeDefined();
    });

    it('should have correct column types', () => {
      const columns = getTableColumns(chatMessages);
      // UUID columns have 'string' dataType in Drizzle
      expect(columns.id.dataType).toBe('string');
      expect(columns.gameId.dataType).toBe('string');
      expect(columns.userId.dataType).toBe('string');
      expect(columns.content.dataType).toBe('string');
      expect(columns.messageType.dataType).toBe('string');
      expect(columns.speaker.dataType).toBe('json');
      expect(columns.rollData.dataType).toBe('json');
      expect(columns.whisperTargets.dataType).toBe('json');
      expect(columns.blind.dataType).toBe('boolean');
      expect(columns.timestamp.dataType).toBe('date');
    });

    it('should have primary key on id column', () => {
      const columns = getTableColumns(chatMessages);
      expect(columns.id.primary).toBe(true);
    });

    it('should have not null constraints on required fields', () => {
      const columns = getTableColumns(chatMessages);
      expect(columns.gameId.notNull).toBe(true);
      expect(columns.content.notNull).toBe(true);
      expect(columns.messageType.notNull).toBe(true);
      expect(columns.blind.notNull).toBe(true);
      expect(columns.timestamp.notNull).toBe(true);
    });

    it('should have default values configured', () => {
      const columns = getTableColumns(chatMessages);
      expect(columns.id.hasDefault).toBe(true);
      expect(columns.messageType.hasDefault).toBe(true);
      expect(columns.blind.hasDefault).toBe(true);
      expect(columns.timestamp.hasDefault).toBe(true);
    });

    it('should have correct column names in database', () => {
      const columns = getTableColumns(chatMessages);
      expect(columns.id.name).toBe('id');
      expect(columns.gameId.name).toBe('game_id');
      expect(columns.userId.name).toBe('user_id');
      expect(columns.messageType.name).toBe('message_type');
    });

    it('should have data as JSONB column', () => {
      const columns = getTableColumns(chatMessages);
      expect(columns.data).toBeDefined();
      expect(columns.data.dataType).toBe('json');
      expect(columns.data.hasDefault).toBe(true);
    });
  });
});
