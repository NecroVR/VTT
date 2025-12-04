import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';

// Mock fastify-plugin
vi.mock('fastify-plugin', () => ({
  default: (fn: any, opts: any) => {
    fn.pluginName = opts.name;
    return fn;
  },
}));

describe('Redis Plugin', () => {
  let mockFastify: FastifyInstance;
  let redisPlugin: any;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create mock Fastify instance
    mockFastify = {
      log: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      },
      config: {
        REDIS_URL: 'redis://localhost:6379',
        DATABASE_URL: 'postgresql://test',
        PORT: 3000,
        HOST: '0.0.0.0',
        NODE_ENV: 'test' as const,
        CORS_ORIGIN: 'http://localhost:5173',
      },
    } as any;

    // Import the plugin
    const pluginModule = await import('./redis.js');
    redisPlugin = pluginModule.default;
  });

  it('should be a function', () => {
    expect(typeof redisPlugin).toBe('function');
  });

  it('should have plugin name "redis-plugin"', () => {
    expect(redisPlugin.pluginName).toBe('redis-plugin');
  });

  it('should log that plugin is registered but not implemented', async () => {
    await redisPlugin(mockFastify);

    expect(mockFastify.log.info).toHaveBeenCalledWith(
      'Redis plugin registered (not yet implemented)'
    );
  });

  it('should complete without errors', async () => {
    await expect(redisPlugin(mockFastify)).resolves.toBeUndefined();
  });

  it('should not throw error if REDIS_URL is missing', async () => {
    mockFastify.config.REDIS_URL = undefined;

    await expect(redisPlugin(mockFastify)).resolves.toBeUndefined();
  });

  it('should log exactly once per registration', async () => {
    await redisPlugin(mockFastify);

    expect(mockFastify.log.info).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple REDIS_URL formats', async () => {
    const urls = [
      'redis://localhost:6379',
      'redis://localhost:6379/0',
      'redis://user:pass@localhost:6379',
      'rediss://localhost:6380',
    ];

    for (const url of urls) {
      vi.clearAllMocks();
      mockFastify.config.REDIS_URL = url;

      await expect(redisPlugin(mockFastify)).resolves.toBeUndefined();
      expect(mockFastify.log.info).toHaveBeenCalledWith(
        'Redis plugin registered (not yet implemented)'
      );
    }
  });
});
