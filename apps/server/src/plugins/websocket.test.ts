import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';

// Mock modules before importing the plugin
vi.mock('@fastify/websocket', () => ({
  default: vi.fn(),
}));

vi.mock('fastify-plugin', () => ({
  default: (fn: any, opts: any) => {
    fn.pluginName = opts.name;
    return fn;
  },
}));

describe('WebSocket Plugin', () => {
  let mockFastify: FastifyInstance;
  let websocketPlugin: any;
  let websocketMock: any;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();

    // Import fresh instances after mocks are set up
    const wsModule = await import('@fastify/websocket');
    websocketMock = wsModule.default;

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
        DATABASE_URL: 'postgresql://test',
        PORT: 3000,
        HOST: '0.0.0.0',
        NODE_ENV: 'test' as const,
        CORS_ORIGIN: 'http://localhost:5173',
      },
    } as any;

    // Import the plugin
    const pluginModule = await import('./websocket.js');
    websocketPlugin = pluginModule.default;
  });

  it('should be a function', () => {
    expect(typeof websocketPlugin).toBe('function');
  });

  it('should have plugin name "websocket-plugin"', () => {
    expect(websocketPlugin.pluginName).toBe('websocket-plugin');
  });

  it('should register @fastify/websocket with correct configuration', async () => {
    await websocketPlugin(mockFastify);

    expect(mockFastify.register).toHaveBeenCalledWith(websocketMock, {
      options: {
        maxPayload: 1048576,
        clientTracking: true,
      },
    });
  });

  it('should log WebSocket enablement', async () => {
    await websocketPlugin(mockFastify);

    expect(mockFastify.log.info).toHaveBeenCalledWith('WebSocket support enabled');
  });

  it('should set maxPayload to 1MB', async () => {
    await websocketPlugin(mockFastify);

    expect(mockFastify.register).toHaveBeenCalledWith(websocketMock,
      expect.objectContaining({
        options: expect.objectContaining({
          maxPayload: 1048576,
        }),
      })
    );
  });

  it('should enable client tracking', async () => {
    await websocketPlugin(mockFastify);

    expect(mockFastify.register).toHaveBeenCalledWith(websocketMock,
      expect.objectContaining({
        options: expect.objectContaining({
          clientTracking: true,
        }),
      })
    );
  });

  it('should register websocket module only once', async () => {
    await websocketPlugin(mockFastify);

    expect(mockFastify.register).toHaveBeenCalledTimes(1);
  });

  it('should log exactly once per registration', async () => {
    await websocketPlugin(mockFastify);

    expect(mockFastify.log.info).toHaveBeenCalledTimes(1);
  });
});
