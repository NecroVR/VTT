import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { createDb } from '@vtt/database';
import { users, sessions, games, scenes, tokens } from '@vtt/database';
import { eq } from 'drizzle-orm';

describe('Authentication Routes', () => {
  let app: FastifyInstance;
  let db: ReturnType<typeof createDb>;

  beforeAll(async () => {
    // Build app with test config
    app = await buildApp({
      NODE_ENV: 'test',
      PORT: 3001,
      HOST: '0.0.0.0',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://claude:Claude^YV18@localhost:5432/vtt',
      REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
      CORS_ORIGIN: '*',
    });

    db = app.db;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data before each test - order matters due to foreign key constraints
    await db.delete(tokens);
    await db.delete(scenes);
    await db.delete(games);
    await db.delete(sessions);
    await db.delete(users);
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('sessionId');
      expect(body.user.email).toBe('test@example.com');
      expect(body.user.username).toBe('testuser');
      expect(body.user).not.toHaveProperty('passwordHash');
    });

    it('should return 400 if email is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          username: 'testuser',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Email, username, and password are required');
    });

    it('should return 400 if email format is invalid', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'invalid-email',
          username: 'testuser',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invalid email format');
    });

    it('should return 400 if password is too short', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'short',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Password must be at least 8 characters long');
    });

    it('should return 409 if email already exists', async () => {
      // Register first user
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
        },
      });

      // Try to register with same email
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          username: 'testuser2',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Email already registered');
    });

    it('should hash the password before storing', async () => {
      const password = 'password123';
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          username: 'testuser',
          password,
        },
      });

      // Check password is hashed in database
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, 'test@example.com'))
        .limit(1);

      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe(password);
      expect(user.passwordHash?.startsWith('$2b$')).toBe(true); // bcrypt hash format
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
        },
      });
    });

    it('should login with valid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('sessionId');
      expect(body.user.email).toBe('test@example.com');
    });

    it('should return 401 with invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'wrong@example.com',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invalid email or password');
    });

    it('should return 401 with invalid password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invalid email or password');
    });

    it('should return 400 if email is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Email and password are required');
    });

    it('should create a new session on successful login', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'password123',
        },
      });

      const body = JSON.parse(response.body);
      const sessionId = body.sessionId;

      // Check session exists in database
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);

      expect(session).toBeDefined();
      expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Register and get session
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
        },
      });

      const body = JSON.parse(response.body);
      sessionId = body.sessionId;
    });

    it('should logout with valid session', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);

      // Check session is deleted
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);

      expect(session).toBeUndefined();
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Register and get session
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
        },
      });

      const body = JSON.parse(response.body);
      sessionId = body.sessionId;
    });

    it('should return current user with valid session', async () => {
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
      expect(body.user.username).toBe('testuser');
      expect(body.user).not.toHaveProperty('passwordHash');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with expired session', async () => {
      // Manually create an expired session
      const [user] = await db.select().from(users).limit(1);
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday

      const [expiredSession] = await db
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
    });
  });
});
