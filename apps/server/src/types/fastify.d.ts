import 'fastify';
import type { User } from '@vtt/shared';

declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
  }
}
