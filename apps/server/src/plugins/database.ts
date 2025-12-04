import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { createDb, type Database } from '@vtt/database';

/**
 * Database plugin - initializes Drizzle ORM connection
 * Decorates Fastify instance with 'db' property
 */
const databasePlugin: FastifyPluginAsync = async (fastify) => {
  const connectionString = fastify.config.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required for database connection');
  }

  // Create database connection
  const db = createDb(connectionString);

  // Decorate Fastify instance with database
  fastify.decorate('db', db);

  // Log successful connection
  fastify.log.info({ connectionString: connectionString.replace(/:[^:@]+@/, ':****@') }, 'Database connection initialized');

  // Note: postgres-js handles connection pooling and cleanup automatically
  // No explicit close hook needed unless specific cleanup is required
};

export default fp(databasePlugin, {
  name: 'database-plugin',
});
