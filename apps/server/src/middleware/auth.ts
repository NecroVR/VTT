import type { FastifyRequest, FastifyReply, preHandlerHookHandler } from 'fastify';
import { sessions, users } from '@vtt/database';
import { eq, and, gt } from 'drizzle-orm';

/**
 * Authentication middleware for Fastify
 * Validates session token from Authorization header and attaches user to request
 */
export const authenticate: preHandlerHookHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing or invalid authorization header' });
  }

  const sessionId = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // Find session and validate it's not expired
    const [session] = await request.server.db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.id, sessionId),
          gt(sessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!session) {
      return reply.status(401).send({ error: 'Invalid or expired session' });
    }

    // Load user
    const [user] = await request.server.db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      return reply.status(401).send({ error: 'User not found' });
    }

    // Attach user to request
    request.user = user;
  } catch (error) {
    request.log.error(error, 'Authentication error');
    return reply.status(500).send({ error: 'Authentication failed' });
  }
};
