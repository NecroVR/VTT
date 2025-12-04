import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';

/**
 * Redis plugin configuration
 * Note: Redis client setup is prepared but not yet implemented
 * Uncomment and install 'ioredis' when ready to use
 */
const redisPlugin: FastifyPluginAsync = async (fastify) => {
  // TODO: Implement Redis connection when needed
  // import Redis from 'ioredis';
  //
  // const redis = new Redis(fastify.config.REDIS_URL || 'redis://localhost:6379');
  //
  // fastify.decorate('redis', redis);
  //
  // fastify.addHook('onClose', async () => {
  //   await redis.quit();
  // });
  //
  // fastify.log.info('Redis client connected');

  fastify.log.info('Redis plugin registered (not yet implemented)');
};

export default fp(redisPlugin, {
  name: 'redis-plugin',
});
