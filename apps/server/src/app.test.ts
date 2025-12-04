import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { EnvConfig } from './types/index.js';

// Mock all dependencies
vi.mock('fastify', () => ({
  default: vi.fn(),
}));

vi.mock('./plugins/cors.js', () => ({
  default: vi.fn(),
}));

vi.mock('./plugins/database.js', () => ({
  default: vi.fn(),
}));

vi.mock('./plugins/redis.js', () => ({
  default: vi.fn(),
}));

vi.mock('./plugins/websocket.js', () => ({
  default: vi.fn(),
}));

vi.mock('./routes/index.js', () => ({
  default: vi.fn(),
}));

vi.mock('./websocket/index.js', () => ({
  default: vi.fn(),
}));

describe('Application Builder', () => {
  let buildApp: any;
  let FastifyMock: any;
  let mockFastifyInstance: any;
  let corsPluginMock: any;
  let databasePluginMock: any;
  let redisPluginMock: any;
  let websocketPluginMock: any;
  let routesMock: any;
  let websocketHandlersMock: any;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create mock Fastify instance
    mockFastifyInstance = {
      register: vi.fn().mockResolvedValue(undefined),
      decorate: vi.fn(),
      log: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      },
      listen: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };

    // Import and setup mocks
    const fastifyModule = await import('fastify');
    FastifyMock = fastifyModule.default;
    FastifyMock.mockReturnValue(mockFastifyInstance);

    const corsModule = await import('./plugins/cors.js');
    corsPluginMock = corsModule.default;

    const dbModule = await import('./plugins/database.js');
    databasePluginMock = dbModule.default;

    const redisModule = await import('./plugins/redis.js');
    redisPluginMock = redisModule.default;

    const wsModule = await import('./plugins/websocket.js');
    websocketPluginMock = wsModule.default;

    const routesModule = await import('./routes/index.js');
    routesMock = routesModule.default;

    const wsHandlersModule = await import('./websocket/index.js');
    websocketHandlersMock = wsHandlersModule.default;

    // Import the app builder
    const appModule = await import('./app.js');
    buildApp = appModule.buildApp;
  });

  const testConfig: EnvConfig = {
    DATABASE_URL: 'postgresql://localhost:5432/vtt',
    REDIS_URL: 'redis://localhost:6379',
    PORT: 3000,
    HOST: '0.0.0.0',
    NODE_ENV: 'test',
    CORS_ORIGIN: 'http://localhost:5173',
  };

  describe('buildApp', () => {
    it('should be a function', () => {
      expect(typeof buildApp).toBe('function');
    });

    it('should create Fastify instance with correct logger config for production', async () => {
      const prodConfig = { ...testConfig, NODE_ENV: 'production' as const };

      await buildApp(prodConfig);

      expect(FastifyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          logger: expect.objectContaining({
            level: 'info',
          }),
        })
      );
    });

    it('should create Fastify instance with debug logger for development', async () => {
      const devConfig = { ...testConfig, NODE_ENV: 'development' as const };

      await buildApp(devConfig);

      expect(FastifyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          logger: expect.objectContaining({
            level: 'debug',
          }),
        })
      );
    });

    it('should enable pino-pretty transport for development', async () => {
      const devConfig = { ...testConfig, NODE_ENV: 'development' as const };

      await buildApp(devConfig);

      expect(FastifyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          logger: expect.objectContaining({
            transport: expect.objectContaining({
              target: 'pino-pretty',
            }),
          }),
        })
      );
    });

    it('should not use pino-pretty transport for production', async () => {
      const prodConfig = { ...testConfig, NODE_ENV: 'production' as const };

      await buildApp(prodConfig);

      expect(FastifyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          logger: expect.objectContaining({
            transport: undefined,
          }),
        })
      );
    });

    it('should configure request ID header', async () => {
      await buildApp(testConfig);

      expect(FastifyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          requestIdHeader: 'x-request-id',
          requestIdLogLabel: 'reqId',
        })
      );
    });

    it('should not disable request logging', async () => {
      await buildApp(testConfig);

      expect(FastifyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          disableRequestLogging: false,
        })
      );
    });

    it('should decorate app with config', async () => {
      await buildApp(testConfig);

      expect(mockFastifyInstance.decorate).toHaveBeenCalledWith('config', testConfig);
    });

    it('should register CORS plugin', async () => {
      await buildApp(testConfig);

      expect(mockFastifyInstance.register).toHaveBeenCalledWith(corsPluginMock);
    });

    it('should register database plugin', async () => {
      await buildApp(testConfig);

      expect(mockFastifyInstance.register).toHaveBeenCalledWith(databasePluginMock);
    });

    it('should register WebSocket plugin', async () => {
      await buildApp(testConfig);

      expect(mockFastifyInstance.register).toHaveBeenCalledWith(websocketPluginMock);
    });

    it('should register Redis plugin', async () => {
      await buildApp(testConfig);

      expect(mockFastifyInstance.register).toHaveBeenCalledWith(redisPluginMock);
    });

    it('should register routes', async () => {
      await buildApp(testConfig);

      expect(mockFastifyInstance.register).toHaveBeenCalledWith(routesMock);
    });

    it('should register WebSocket handlers', async () => {
      await buildApp(testConfig);

      expect(mockFastifyInstance.register).toHaveBeenCalledWith(websocketHandlersMock);
    });

    it('should register all plugins in correct order', async () => {
      await buildApp(testConfig);

      const registerCalls = mockFastifyInstance.register.mock.calls;

      expect(registerCalls[0][0]).toBe(corsPluginMock);
      expect(registerCalls[1][0]).toBe(databasePluginMock);
      expect(registerCalls[2][0]).toBe(websocketPluginMock);
      expect(registerCalls[3][0]).toBe(redisPluginMock);
      expect(registerCalls[4][0]).toBe(routesMock);
      expect(registerCalls[5][0]).toBe(websocketHandlersMock);
    });

    it('should register exactly 6 items', async () => {
      await buildApp(testConfig);

      expect(mockFastifyInstance.register).toHaveBeenCalledTimes(6);
    });

    it('should log success message', async () => {
      await buildApp(testConfig);

      expect(mockFastifyInstance.log.info).toHaveBeenCalledWith('Fastify app built successfully');
    });

    it('should return Fastify instance', async () => {
      const app = await buildApp(testConfig);

      expect(app).toBe(mockFastifyInstance);
    });

    it('should handle different NODE_ENV values', async () => {
      const environments: Array<'development' | 'production' | 'test'> = ['development', 'production', 'test'];

      for (const env of environments) {
        vi.clearAllMocks();
        const config = { ...testConfig, NODE_ENV: env };

        const app = await buildApp(config);

        expect(app).toBe(mockFastifyInstance);
        expect(mockFastifyInstance.decorate).toHaveBeenCalledWith('config', config);
      }
    });

    it('should propagate errors from plugin registration', async () => {
      const error = new Error('Plugin registration failed');
      mockFastifyInstance.register.mockRejectedValueOnce(error);

      await expect(buildApp(testConfig)).rejects.toThrow('Plugin registration failed');
    });
  });
});
