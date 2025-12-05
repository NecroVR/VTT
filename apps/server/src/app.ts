import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import corsPlugin from './plugins/cors.js';
import websocketPlugin from './plugins/websocket.js';
import redisPlugin from './plugins/redis.js';
import databasePlugin from './plugins/database.js';
import multipartPlugin from './plugins/multipart.js';
import staticPlugin from './plugins/static.js';
import routes from './routes/index.js';
import websocketHandlers from './websocket/index.js';
import type { EnvConfig } from './types/index.js';

/**
 * Build and configure the Fastify application
 */
export async function buildApp(config: EnvConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: config.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
    requestIdLogLabel: 'reqId',
    disableRequestLogging: false,
    requestIdHeader: 'x-request-id',
  });

  // Decorate app with config
  app.decorate('config', config);

  // Register plugins
  await app.register(corsPlugin);
  await app.register(databasePlugin);
  await app.register(multipartPlugin);
  await app.register(staticPlugin);
  await app.register(websocketPlugin);
  await app.register(redisPlugin);

  // Register routes
  await app.register(routes);

  // Register WebSocket handlers
  await app.register(websocketHandlers);

  app.log.info('Fastify app built successfully');

  return app;
}
