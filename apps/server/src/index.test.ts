import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';

describe('Server Entry Point', () => {
  let mockApp: Partial<FastifyInstance>;
  let mockBuildApp: any;
  let mockLoadEnvConfig: any;
  let processExitSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Create mock Fastify app
    mockApp = {
      listen: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      log: {
        info: vi.fn(),
        error: vi.fn(),
      },
    };

    // Mock buildApp
    mockBuildApp = vi.fn().mockResolvedValue(mockApp);

    // Mock loadEnvConfig
    mockLoadEnvConfig = vi.fn().mockReturnValue({
      NODE_ENV: 'test',
      PORT: 3000,
      HOST: '0.0.0.0',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      REDIS_URL: 'redis://localhost:6379',
      CORS_ORIGIN: '*',
    });

    // Spy on process methods
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Remove all process event listeners
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('uncaughtException');
    process.removeAllListeners('unhandledRejection');
  });

  it('should start server successfully', async () => {
    // Mock the modules
    vi.doMock('./app.js', () => ({
      buildApp: mockBuildApp,
    }));
    vi.doMock('./config/env.js', () => ({
      loadEnvConfig: mockLoadEnvConfig,
    }));

    // Import and run main (we need to import after mocking)
    const { default: indexModule } = await import('./index.js?t=' + Date.now());

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockLoadEnvConfig).toHaveBeenCalled();
    expect(mockBuildApp).toHaveBeenCalledWith({
      NODE_ENV: 'test',
      PORT: 3000,
      HOST: '0.0.0.0',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      REDIS_URL: 'redis://localhost:6379',
      CORS_ORIGIN: '*',
    });
    expect(mockApp.listen).toHaveBeenCalledWith({
      port: 3000,
      host: '0.0.0.0',
    });
    expect(mockApp.log?.info).toHaveBeenCalledWith(
      'Server listening on 0.0.0.0:3000 in test mode'
    );
  });

  it('should register SIGINT handler', async () => {
    vi.doMock('./app.js', () => ({
      buildApp: mockBuildApp,
    }));
    vi.doMock('./config/env.js', () => ({
      loadEnvConfig: mockLoadEnvConfig,
    }));

    await import('./index.js?t=' + Date.now());
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify SIGINT handler is registered
    expect(process.listenerCount('SIGINT')).toBeGreaterThan(0);

    // Trigger SIGINT
    process.emit('SIGINT');
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockApp.log?.info).toHaveBeenCalledWith('SIGINT received, shutting down gracefully...');
    expect(mockApp.close).toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should register SIGTERM handler', async () => {
    vi.doMock('./app.js', () => ({
      buildApp: mockBuildApp,
    }));
    vi.doMock('./config/env.js', () => ({
      loadEnvConfig: mockLoadEnvConfig,
    }));

    await import('./index.js?t=' + Date.now());
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify SIGTERM handler is registered
    expect(process.listenerCount('SIGTERM')).toBeGreaterThan(0);

    // Trigger SIGTERM
    process.emit('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockApp.log?.info).toHaveBeenCalledWith('SIGTERM received, shutting down gracefully...');
    expect(mockApp.close).toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should handle graceful shutdown errors', async () => {
    const shutdownError = new Error('Shutdown failed');
    mockApp.close = vi.fn().mockRejectedValue(shutdownError);

    vi.doMock('./app.js', () => ({
      buildApp: mockBuildApp,
    }));
    vi.doMock('./config/env.js', () => ({
      loadEnvConfig: mockLoadEnvConfig,
    }));

    await import('./index.js?t=' + Date.now());
    await new Promise(resolve => setTimeout(resolve, 100));

    // Trigger SIGINT
    process.emit('SIGINT');
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockApp.log?.error).toHaveBeenCalledWith(
      { err: shutdownError },
      'Error during shutdown'
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle uncaught exceptions', async () => {
    vi.doMock('./app.js', () => ({
      buildApp: mockBuildApp,
    }));
    vi.doMock('./config/env.js', () => ({
      loadEnvConfig: mockLoadEnvConfig,
    }));

    await import('./index.js?t=' + Date.now());
    await new Promise(resolve => setTimeout(resolve, 100));

    const testError = new Error('Uncaught exception');
    process.emit('uncaughtException', testError);
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockApp.log?.error).toHaveBeenCalledWith(
      { error: testError },
      'Uncaught exception'
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle unhandled rejections', async () => {
    vi.doMock('./app.js', () => ({
      buildApp: mockBuildApp,
    }));
    vi.doMock('./config/env.js', () => ({
      loadEnvConfig: mockLoadEnvConfig,
    }));

    await import('./index.js?t=' + Date.now());
    await new Promise(resolve => setTimeout(resolve, 100));

    const testReason = new Error('Unhandled rejection');
    const testPromise = Promise.reject(testReason);
    process.emit('unhandledRejection', testReason, testPromise);
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockApp.log?.error).toHaveBeenCalledWith(
      { reason: testReason, promise: testPromise },
      'Unhandled rejection'
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle server startup failures', async () => {
    const startupError = new Error('Failed to start');
    mockBuildApp = vi.fn().mockRejectedValue(startupError);

    vi.doMock('./app.js', () => ({
      buildApp: mockBuildApp,
    }));
    vi.doMock('./config/env.js', () => ({
      loadEnvConfig: mockLoadEnvConfig,
    }));

    await import('./index.js?t=' + Date.now());
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to start server:', startupError);
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should log successful shutdown', async () => {
    vi.doMock('./app.js', () => ({
      buildApp: mockBuildApp,
    }));
    vi.doMock('./config/env.js', () => ({
      loadEnvConfig: mockLoadEnvConfig,
    }));

    await import('./index.js?t=' + Date.now());
    await new Promise(resolve => setTimeout(resolve, 100));

    // Trigger SIGTERM
    process.emit('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockApp.log?.info).toHaveBeenCalledWith('Server closed successfully');
  });
});
