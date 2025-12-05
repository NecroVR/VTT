import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import type { FastifyPluginAsync } from 'fastify';

/**
 * CORS plugin configuration
 * Enables Cross-Origin Resource Sharing for the API
 * Supports local network access for development
 */
const corsPlugin: FastifyPluginAsync = async (fastify) => {
  // Build list of allowed origins
  const configuredOrigin = fastify.config.CORS_ORIGIN;

  await fastify.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) {
        callback(null, true);
        return;
      }

      try {
        const originUrl = new URL(origin);

        // Allow localhost with any port (development)
        if (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1') {
          callback(null, true);
          return;
        }

        // Allow private network IPs (local network/VPN access)
        // 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 100.x.x.x (CGNAT/Tailscale)
        const ip = originUrl.hostname;
        if (
          ip.startsWith('10.') ||
          ip.startsWith('100.') ||
          ip.startsWith('192.168.') ||
          /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)
        ) {
          callback(null, true);
          return;
        }

        // Allow configured origin
        if (origin === configuredOrigin ||
            origin === configuredOrigin.replace('https://', 'http://') ||
            origin === configuredOrigin.replace('http://', 'https://')) {
          callback(null, true);
          return;
        }

        callback(new Error('Not allowed by CORS'), false);
      } catch {
        callback(new Error('Invalid origin'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  fastify.log.info(`CORS enabled for localhost, private networks, and ${configuredOrigin}`);
};

export default fp(corsPlugin, {
  name: 'cors-plugin',
});
