import type { FastifyPluginAsync } from 'fastify';
import { users, sessions } from '@vtt/database';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import type { RegisterRequest, LoginRequest, AuthResponse } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

const SALT_ROUNDS = 10;
const SESSION_DURATION_DAYS = 7;

/**
 * Authentication API routes
 * Handles user registration, login, logout, and session management
 */
const authRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/v1/auth/register - Register a new user
   */
  fastify.post<{ Body: RegisterRequest }>(
    '/auth/register',
    async (request, reply) => {
      const { email, username, password } = request.body;

      // Validate input
      if (!email || !username || !password) {
        return reply.status(400).send({ error: 'Email, username, and password are required' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return reply.status(400).send({ error: 'Invalid email format' });
      }

      // Validate password length
      if (password.length < 8) {
        return reply.status(400).send({ error: 'Password must be at least 8 characters long' });
      }

      try {
        // Check if email already exists
        const [existingUser] = await fastify.db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser) {
          return reply.status(409).send({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Create user
        const [newUser] = await fastify.db
          .insert(users)
          .values({
            email,
            username,
            passwordHash,
          })
          .returning({
            id: users.id,
            email: users.email,
            username: users.username,
            accountTier: users.accountTier,
            storageQuotaBytes: users.storageQuotaBytes,
            storageUsedBytes: users.storageUsedBytes,
            createdAt: users.createdAt,
          });

        // Create session
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

        const [session] = await fastify.db
          .insert(sessions)
          .values({
            userId: newUser.id,
            expiresAt,
          })
          .returning();

        const response: AuthResponse = {
          user: newUser,
          sessionId: session.id,
        };

        return reply.status(201).send(response);
      } catch (error) {
        fastify.log.error(error, 'Failed to register user');
        return reply.status(500).send({ error: 'Failed to register user' });
      }
    }
  );

  /**
   * POST /api/v1/auth/login - Login with email and password
   */
  fastify.post<{ Body: LoginRequest }>(
    '/auth/login',
    async (request, reply) => {
      const { email, password } = request.body;

      // Validate input
      if (!email || !password) {
        return reply.status(400).send({ error: 'Email and password are required' });
      }

      try {
        // Find user by email
        const [user] = await fastify.db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || !user.passwordHash) {
          return reply.status(401).send({ error: 'Invalid email or password' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
          return reply.status(401).send({ error: 'Invalid email or password' });
        }

        // Create new session
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

        const [session] = await fastify.db
          .insert(sessions)
          .values({
            userId: user.id,
            expiresAt,
          })
          .returning();

        const response: AuthResponse = {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            accountTier: user.accountTier,
            storageQuotaBytes: user.storageQuotaBytes,
            storageUsedBytes: user.storageUsedBytes,
            createdAt: user.createdAt,
          },
          sessionId: session.id,
        };

        return reply.status(200).send(response);
      } catch (error) {
        fastify.log.error(error, 'Failed to login');
        return reply.status(500).send({ error: 'Login failed' });
      }
    }
  );

  /**
   * POST /api/v1/auth/logout - Logout and invalidate session
   */
  fastify.post(
    '/auth/logout',
    { preHandler: authenticate },
    async (request, reply) => {
      const authHeader = request.headers.authorization;
      const sessionId = authHeader?.substring(7); // Remove 'Bearer ' prefix

      if (!sessionId) {
        return reply.status(400).send({ error: 'Invalid session' });
      }

      try {
        // Delete session
        await fastify.db
          .delete(sessions)
          .where(eq(sessions.id, sessionId));

        return reply.status(200).send({ success: true });
      } catch (error) {
        fastify.log.error(error, 'Failed to logout');
        return reply.status(500).send({ error: 'Logout failed' });
      }
    }
  );

  /**
   * GET /api/v1/auth/me - Get current authenticated user
   */
  fastify.get(
    '/auth/me',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      return reply.status(200).send({ user: request.user });
    }
  );
};

export default authRoute;
