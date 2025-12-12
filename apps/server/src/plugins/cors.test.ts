import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';

// Mock modules before importing the plugin
vi.mock('@fastify/cors', () => ({
  default: vi.fn(),
}));

vi.mock('fastify-plugin', () => ({
  default: (fn: any, opts: any) => {
    fn.pluginName = opts.name;
    return fn;
  },
}));

describe('CORS Plugin', () => {
  let mockFastify: FastifyInstance;
  let corsPlugin: any;
  let corsMock: any;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();

    // Import fresh instances after mocks are set up
    const corsModule = await import('@fastify/cors');
    corsMock = corsModule.default;

    // Create mock Fastify instance
    mockFastify = {
      register: vi.fn().mockResolvedValue(undefined),
      log: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      },
      config: {
        CORS_ORIGIN: 'http://localhost:5173',
        DATABASE_URL: 'postgresql://test',
        PORT: 3000,
        HOST: '0.0.0.0',
        NODE_ENV: 'test' as const,
      },
    } as any;

    // Import the plugin
    const pluginModule = await import('./cors.js');
    corsPlugin = pluginModule.default;
  });

  it('should be a function', () => {
    expect(typeof corsPlugin).toBe('function');
  });

  it('should have plugin name "cors-plugin"', () => {
    expect(corsPlugin.pluginName).toBe('cors-plugin');
  });

  it('should register @fastify/cors with correct configuration', async () => {
    await corsPlugin(mockFastify);

    expect(mockFastify.register).toHaveBeenCalledWith(corsMock,
      expect.objectContaining({
        origin: expect.any(Function),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    );
  });

  it('should log CORS enablement with origin', async () => {
    await corsPlugin(mockFastify);

    expect(mockFastify.log.info).toHaveBeenCalledWith(
      'CORS enabled for localhost, private networks, and http://localhost:5173'
    );
  });

  it('should use CORS origin from config', async () => {
    mockFastify.config.CORS_ORIGIN = 'https://example.com';

    await corsPlugin(mockFastify);

    expect(mockFastify.register).toHaveBeenCalledWith(corsMock,
      expect.objectContaining({
        origin: expect.any(Function),
      })
    );

    expect(mockFastify.log.info).toHaveBeenCalledWith(
      'CORS enabled for localhost, private networks, and https://example.com'
    );
  });

  it('should enable credentials', async () => {
    await corsPlugin(mockFastify);

    expect(mockFastify.register).toHaveBeenCalledWith(corsMock,
      expect.objectContaining({
        credentials: true,
      })
    );
  });

  it('should allow standard HTTP methods', async () => {
    await corsPlugin(mockFastify);

    expect(mockFastify.register).toHaveBeenCalledWith(corsMock,
      expect.objectContaining({
        methods: expect.arrayContaining(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']),
      })
    );
  });

  it('should allow Content-Type and Authorization headers', async () => {
    await corsPlugin(mockFastify);

    expect(mockFastify.register).toHaveBeenCalledWith(corsMock,
      expect.objectContaining({
        allowedHeaders: expect.arrayContaining(['Content-Type', 'Authorization']),
      })
    );
  });
});
