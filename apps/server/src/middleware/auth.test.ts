import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../app.js';
import type { FastifyInstance } from 'fastify';
import { sessions, users } from '@vtt/database';
import { eq, sql } from 'drizzle-orm';

describe('Authentication Middleware', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({
      NODE_ENV: 'test',
      PORT: 3002,
      HOST: '0.0.0.0',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://claude:Claude^YV18@localhost:5432/vtt',
      REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
      CORS_ORIGIN: '*',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await app.db.delete(sessions);
    await app.db.delete(users);
  });

  describe('authenticate preHandler', () => {
    it('should attach user to request with valid session', async () => {
      // Create test user and session
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
        },
      });

      const { sessionId } = JSON.parse(registerResponse.body);

      // Test protected endpoint
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe('test@example.com');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Missing or invalid authorization header');
    });

    it('should return 401 with malformed authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: 'InvalidFormat',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Missing or invalid authorization header');
    });

    it('should return 401 with invalid session ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: 'Bearer 00000000-0000-0000-0000-000000000000',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invalid or expired session');
    });

    it('should return 401 with expired session', async () => {
      // Create user
      const [user] = await app.db
        .insert(users)
        .values({
          email: 'test@example.com',
          username: 'testuser',
          passwordHash: 'hash',
        })
        .returning();

      // Create expired session
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);

      const [expiredSession] = await app.db
        .insert(sessions)
        .values({
          userId: user.id,
          expiresAt: expiredDate,
        })
        .returning();

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: `Bearer ${expiredSession.id}`,
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invalid or expired session');
    });

    it('should not include passwordHash in user object', async () => {
      // Create test user and session
      const registerResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
        },
      });

      const { sessionId } = JSON.parse(registerResponse.body);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.user).not.toHaveProperty('passwordHash');
    });

    it('should return 401 with invalid UUID format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: 'Bearer not-a-valid-uuid',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invalid session format');
    });
  });
});
