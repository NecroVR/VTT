import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Database } from '@vtt/database';

// Mock modules before importing the plugin
vi.mock('@vtt/database', () => ({
  createDb: vi.fn(),
}));

vi.mock('fastify-plugin', () => ({
  default: (fn: any, opts: any) => {
    fn.pluginName = opts.name;
    return fn;
  },
}));

describe('Database Plugin', () => {
  let mockFastify: FastifyInstance;
  let databasePlugin: any;
  let createDbMock: any;
  let mockDb: Database;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();

    // Import fresh instances after mocks are set up
    const dbModule = await import('@vtt/database');
    createDbMock = dbModule.createDb;

    // Create mock database instance
    mockDb = {} as Database;
    createDbMock.mockReturnValue(mockDb);

    // Create mock Fastify instance
    mockFastify = {
      decorate: vi.fn(),
      log: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      },
      config: {
        DATABASE_URL: 'postgresql://claude:password@localhost:5432/vtt',
        PORT: 3000,
        HOST: '0.0.0.0',
        NODE_ENV: 'test' as const,
        CORS_ORIGIN: 'http://localhost:5173',
      },
    } as any;

    // Import the plugin
    const pluginModule = await import('./database.js');
    databasePlugin = pluginModule.default;
  });

  it('should be a function', () => {
    expect(typeof databasePlugin).toBe('function');
  });

  it('should have plugin name "database-plugin"', () => {
    expect(databasePlugin.pluginName).toBe('database-plugin');
  });

  it('should create database connection with connection string', async () => {
    await databasePlugin(mockFastify);

    expect(createDbMock).toHaveBeenCalledWith('postgresql://claude:password@localhost:5432/vtt');
  });

  it('should decorate fastify instance with db', async () => {
    await databasePlugin(mockFastify);

    expect(mockFastify.decorate).toHaveBeenCalledWith('db', mockDb);
  });

  it('should log successful connection with masked password', async () => {
    await databasePlugin(mockFastify);

    expect(mockFastify.log.info).toHaveBeenCalledWith(
      { connectionString: 'postgresql://claude:****@localhost:5432/vtt' },
      'Database connection initialized'
    );
  });

  it('should throw error if DATABASE_URL is missing', async () => {
    mockFastify.config.DATABASE_URL = '';

    await expect(databasePlugin(mockFastify)).rejects.toThrow(
      'DATABASE_URL is required for database connection'
    );
  });

  it('should throw error if DATABASE_URL is undefined', async () => {
    (mockFastify.config as any).DATABASE_URL = undefined;

    await expect(databasePlugin(mockFastify)).rejects.toThrow(
      'DATABASE_URL is required for database connection'
    );
  });

  it('should mask password in connection string with special characters', async () => {
    mockFastify.config.DATABASE_URL = 'postgresql://user:password123!@host:5432/db';

    await databasePlugin(mockFastify);

    expect(mockFastify.log.info).toHaveBeenCalledWith(
      { connectionString: 'postgresql://user:****@host:5432/db' },
      'Database connection initialized'
    );
  });

  it('should handle connection string without password', async () => {
    mockFastify.config.DATABASE_URL = 'postgresql://localhost:5432/vtt';

    await databasePlugin(mockFastify);

    expect(mockFastify.log.info).toHaveBeenCalledWith(
      { connectionString: 'postgresql://localhost:5432/vtt' },
      'Database connection initialized'
    );
  });

  it('should call createDb only once per registration', async () => {
    await databasePlugin(mockFastify);

    expect(createDbMock).toHaveBeenCalledTimes(1);
  });
});
