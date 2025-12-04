import type { FastifyInstance } from 'fastify';
import { sessions, users } from '@vtt/database';
import { eq, and, gt } from 'drizzle-orm';

/**
 * Validated user information from session
 */
export interface AuthenticatedUser {
  userId: string;
  username: string;
  email: string;
}

/**
 * Validate a session token and return user information
 * @param server - Fastify server instance (for database access)
 * @param sessionToken - The session token to validate
 * @returns User information if valid, null otherwise
 */
export async function validateSession(
  server: FastifyInstance,
  sessionToken: string
): Promise<AuthenticatedUser | null> {
  try {
    // Find session and validate it's not expired
    const [session] = await server.db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.id, sessionToken),
          gt(sessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!session) {
      return null;
    }

    // Load user
    const [user] = await server.db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      username: user.username,
      email: user.email,
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

/**
 * Extract session token from various sources
 * Supports:
 * - Authorization header (Bearer token)
 * - Query parameter (?token=...)
 * - Cookie
 *
 * @param headers - Request headers
 * @param query - Query parameters
 * @returns Session token or null
 */
export function extractSessionToken(
  headers: Record<string, string | string[] | undefined>,
  query: Record<string, string | string[] | undefined>
): string | null {
  // Try Authorization header first
  const authHeader = headers.authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try query parameter
  const queryToken = query.token;
  if (queryToken && typeof queryToken === 'string') {
    return queryToken;
  }

  // Try cookie
  const cookieHeader = headers.cookie;
  if (cookieHeader && typeof cookieHeader === 'string') {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const sessionCookie = cookies.find(c => c.startsWith('session='));
    if (sessionCookie) {
      return sessionCookie.substring(8); // Remove 'session='
    }
  }

  return null;
}
