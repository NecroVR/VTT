import Fastify from 'fastify';
import type { FastifyInstance, FastifyServerOptions } from 'fastify';
import fs from 'fs';
import https from 'https';
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
  // Prepare Fastify options
  const fastifyOptions: FastifyServerOptions = {
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
  };

  // Add HTTPS configuration if enabled
  if (config.HTTPS_ENABLED && config.HTTPS_CERT_PATH && config.HTTPS_KEY_PATH) {
    (fastifyOptions as any).https = {
      key: fs.readFileSync(config.HTTPS_KEY_PATH),
      cert: fs.readFileSync(config.HTTPS_CERT_PATH),
    } as https.ServerOptions;
  }

  const app = Fastify(fastifyOptions);

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
