import 'dotenv/config';
import { buildApp } from './app.js';
import { loadEnvConfig } from './config/env.js';

/**
 * Application entry point
 * Loads configuration, builds the app, and starts the server
 */
async function main() {
  try {
    // Load environment configuration
    const config = loadEnvConfig();

    // Build Fastify app
    const app = await buildApp(config);

    // Start server
    await app.listen({
      port: config.PORT,
      host: config.HOST,
    });

    app.log.info(
      `Server listening on ${config.HOST}:${config.PORT} in ${config.NODE_ENV} mode`
    );

    // Graceful shutdown handlers
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        app.log.info(`${signal} received, shutting down gracefully...`);
        try {
          await app.close();
          app.log.info('Server closed successfully');
          process.exit(0);
        } catch (err) {
          app.log.error({ err }, 'Error during shutdown');
          process.exit(1);
        }
      });
    });

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      app.log.error({ error }, 'Uncaught exception');
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      app.log.error({ reason, promise }, 'Unhandled rejection');
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
main();
