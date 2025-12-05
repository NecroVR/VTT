import { describe, it, expect } from 'vitest';
import { getTableColumns, getTableName } from 'drizzle-orm';
import { users, sessions } from './users.js';

describe('users schema', () => {
  describe('table structure', () => {
    it('should have correct table name', () => {
      const tableName = getTableName(users);
      expect(tableName).toBe('users');
    });

    it('should have all required columns', () => {
      const columns = getTableColumns(users);
      expect(columns.id).toBeDefined();
      expect(columns.email).toBeDefined();
      expect(columns.username).toBeDefined();
      expect(columns.passwordHash).toBeDefined();
      expect(columns.createdAt).toBeDefined();
      expect(columns.updatedAt).toBeDefined();
    });

    it('should have correct column types', () => {
      const columns = getTableColumns(users);
      // UUID columns have 'string' dataType in Drizzle
      expect(columns.id.dataType).toBe('string');
      expect(columns.email.dataType).toBe('string');
      expect(columns.username.dataType).toBe('string');
      expect(columns.passwordHash.dataType).toBe('string');
      expect(columns.createdAt.dataType).toBe('date');
      expect(columns.updatedAt.dataType).toBe('date');
    });

    it('should have primary key on id column', () => {
      const columns = getTableColumns(users);
      expect(columns.id.primary).toBe(true);
    });

    it('should have not null constraint on required fields', () => {
      const columns = getTableColumns(users);
      expect(columns.email.notNull).toBe(true);
      expect(columns.username.notNull).toBe(true);
      expect(columns.createdAt.notNull).toBe(true);
      expect(columns.updatedAt.notNull).toBe(true);
    });

    it('should have unique constraint on email', () => {
      const columns = getTableColumns(users);
      expect(columns.email.isUnique).toBe(true);
    });

    it('should have default values configured', () => {
      const columns = getTableColumns(users);
      expect(columns.id.hasDefault).toBe(true);
      expect(columns.createdAt.hasDefault).toBe(true);
      expect(columns.updatedAt.hasDefault).toBe(true);
    });

    it('should allow null for passwordHash', () => {
      const columns = getTableColumns(users);
      expect(columns.passwordHash.notNull).toBe(false);
    });

    it('should have correct column names in database', () => {
      const columns = getTableColumns(users);
      expect(columns.id.name).toBe('id');
      expect(columns.email.name).toBe('email');
      expect(columns.username.name).toBe('username');
      expect(columns.passwordHash.name).toBe('password_hash');
    });
  });
});

describe('sessions schema', () => {
  describe('table structure', () => {
    it('should have correct table name', () => {
      const tableName = getTableName(sessions);
      expect(tableName).toBe('sessions');
    });

    it('should have all required columns', () => {
      const columns = getTableColumns(sessions);
      expect(columns.id).toBeDefined();
      expect(columns.userId).toBeDefined();
      expect(columns.expiresAt).toBeDefined();
      expect(columns.createdAt).toBeDefined();
    });

    it('should have correct column types', () => {
      const columns = getTableColumns(sessions);
      // UUID columns have 'string' dataType in Drizzle
      expect(columns.id.dataType).toBe('string');
      expect(columns.userId.dataType).toBe('string');
      expect(columns.expiresAt.dataType).toBe('date');
      expect(columns.createdAt.dataType).toBe('date');
    });

    it('should have primary key on id column', () => {
      const columns = getTableColumns(sessions);
      expect(columns.id.primary).toBe(true);
    });

    it('should have not null constraints', () => {
      const columns = getTableColumns(sessions);
      expect(columns.userId.notNull).toBe(true);
      expect(columns.expiresAt.notNull).toBe(true);
      expect(columns.createdAt.notNull).toBe(true);
    });

    it('should have default values configured', () => {
      const columns = getTableColumns(sessions);
      expect(columns.id.hasDefault).toBe(true);
      expect(columns.createdAt.hasDefault).toBe(true);
    });

    it('should have correct column names in database', () => {
      const columns = getTableColumns(sessions);
      expect(columns.id.name).toBe('id');
      expect(columns.userId.name).toBe('user_id');
      expect(columns.expiresAt.name).toBe('expires_at');
      expect(columns.createdAt.name).toBe('created_at');
    });
  });
});
