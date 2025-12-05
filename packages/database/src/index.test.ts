import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDb } from './index.js';
import * as schema from './schema';

// Mock the postgres module
vi.mock('postgres', () => ({
  default: vi.fn(() => ({
    end: vi.fn(),
  })),
}));

// Mock drizzle-orm
vi.mock('drizzle-orm/postgres-js', () => ({
  drizzle: vi.fn((client, options) => ({
    client,
    schema: options?.schema,
  })),
}));

describe('index module', () => {
  describe('createDb function', () => {
    let postgres: any;
    let drizzle: any;

    beforeEach(async () => {
      // Clear all mocks before each test
      vi.clearAllMocks();

      // Get mocked modules
      postgres = (await import('postgres')).default;
      drizzle = (await import('drizzle-orm/postgres-js')).drizzle;
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should create database connection with provided connection string', () => {
      const connectionString = 'postgresql://user:pass@localhost:5432/testdb';

      createDb(connectionString);

      expect(postgres).toHaveBeenCalledWith(connectionString);
    });

    it('should initialize drizzle with postgres client', () => {
      const connectionString = 'postgresql://user:pass@localhost:5432/testdb';

      createDb(connectionString);

      expect(drizzle).toHaveBeenCalled();
      expect(drizzle).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ schema: expect.anything() })
      );
    });

    it('should return drizzle database instance', () => {
      const connectionString = 'postgresql://user:pass@localhost:5432/testdb';

      const db = createDb(connectionString);

      expect(db).toBeDefined();
      expect(db).toHaveProperty('client');
      expect(db).toHaveProperty('schema');
    });

    it('should pass schema to drizzle', () => {
      const connectionString = 'postgresql://user:pass@localhost:5432/testdb';

      createDb(connectionString);

      expect(drizzle).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ schema })
      );
    });
  });

  describe('schema exports', () => {
    it('should export all schema tables', async () => {
      const exports = await import('./index.js');

      expect(exports.users).toBeDefined();
      expect(exports.sessions).toBeDefined();
      expect(exports.games).toBeDefined();
      expect(exports.scenes).toBeDefined();
      expect(exports.tokens).toBeDefined();
      expect(exports.walls).toBeDefined();
      expect(exports.actors).toBeDefined();
      expect(exports.items).toBeDefined();
      expect(exports.combats).toBeDefined();
      expect(exports.combatants).toBeDefined();
      expect(exports.chatMessages).toBeDefined();
      expect(exports.ambientLights).toBeDefined();
    });

    it('should export Database type', async () => {
      const exports = await import('./index.js');

      // Check that the module exports include Database type
      // TypeScript types are compile-time only, so we check the function exists
      expect(exports.createDb).toBeDefined();
      expect(typeof exports.createDb).toBe('function');
    });

    it('should export createDb function', async () => {
      const { createDb } = await import('./index.js');

      expect(createDb).toBeDefined();
      expect(typeof createDb).toBe('function');
    });
  });
});
