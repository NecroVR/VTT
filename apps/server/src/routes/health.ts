import type { FastifyPluginAsync } from 'fastify';
import { sql } from 'drizzle-orm';

/**
 * Health check route
 * GET /health - Returns server health status
 */
const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async () => {
    // Test database connection
    let dbStatus = 'ok';
    try {
      await fastify.db.execute(sql`SELECT 1`);
    } catch (error) {
      dbStatus = 'error';
      fastify.log.error(error, 'Database health check failed');
    }

    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: fastify.config.NODE_ENV,
      database: dbStatus,
    };
  });
};

export default healthRoute;
