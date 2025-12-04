import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { createDb } from '@vtt/database';
import { users } from '@vtt/database';

describe('Users Routes', () => {
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
    // Clean up test data before each test
    await db.delete(users);
  });

  describe('GET /api/v1/users', () => {
    it('should return empty array when no users exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.users).toEqual([]);
    });

    it('should list all users', async () => {
      // Create test users
      await db.insert(users).values([
        { email: 'user1@example.com', username: 'user1' },
        { email: 'user2@example.com', username: 'user2' },
        { email: 'user3@example.com', username: 'user3' },
      ]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.users).toHaveLength(3);
      expect(body.users[0].username).toBe('user1');
      expect(body.users[1].username).toBe('user2');
      expect(body.users[2].username).toBe('user3');
    });

    it('should return users with all properties', async () => {
      await db.insert(users).values({
        email: 'test@example.com',
        username: 'testuser',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.users).toHaveLength(1);

      const user = body.users[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
      expect(user.email).toBe('test@example.com');
      expect(user.username).toBe('testuser');
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should get user by ID', async () => {
      // Create a test user
      const [createdUser] = await db.insert(users).values({
        email: 'test@example.com',
        username: 'testuser',
      }).returning();

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/users/${createdUser.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.user.id).toBe(createdUser.id);
      expect(body.user.email).toBe('test@example.com');
      expect(body.user.username).toBe('testuser');
    });

    it('should return user with all properties', async () => {
      const [createdUser] = await db.insert(users).values({
        email: 'test@example.com',
        username: 'testuser',
      }).returning();

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/users/${createdUser.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.user).toHaveProperty('id');
      expect(body.user).toHaveProperty('email');
      expect(body.user).toHaveProperty('username');
      expect(body.user).toHaveProperty('createdAt');
      expect(body.user).toHaveProperty('updatedAt');
    });

    it('should return 404 if user does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/00000000-0000-0000-0000-000000000000',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('User not found');
    });

    it('should handle invalid UUID format gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/invalid-uuid',
      });

      // Should return 404 or error (database will reject invalid UUID)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/v1/users', () => {
    it('should create a new user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: {
          email: 'newuser@example.com',
          username: 'newuser',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.user).toHaveProperty('id');
      expect(body.user.email).toBe('newuser@example.com');
      expect(body.user.username).toBe('newuser');
      expect(body.user).toHaveProperty('createdAt');
      expect(body.user).toHaveProperty('updatedAt');
    });

    it('should persist user to database', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: {
          email: 'persist@example.com',
          username: 'persistuser',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      const userId = body.user.id;

      // Verify user exists in database
      const allUsers = await db.select().from(users);
      const foundUser = allUsers.find(u => u.id === userId);
      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe('persist@example.com');
      expect(foundUser?.username).toBe('persistuser');
    });

    it('should return 400 if email is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: {
          username: 'onlyusername',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Email and username are required');
    });

    it('should return 400 if username is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: {
          email: 'onlyemail@example.com',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Email and username are required');
    });

    it('should return 400 if both email and username are missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Email and username are required');
    });

    it('should return 400 if email is empty string', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: {
          email: '',
          username: 'testuser',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Email and username are required');
    });

    it('should return 400 if username is empty string', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: {
          email: 'test@example.com',
          username: '',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Email and username are required');
    });

    it('should return 500 if database constraint is violated (duplicate email)', async () => {
      // Create initial user
      await db.insert(users).values({
        email: 'duplicate@example.com',
        username: 'user1',
      });

      // Try to create user with same email
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: {
          email: 'duplicate@example.com',
          username: 'user2',
        },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Failed to create user');
    });

    it('should allow duplicate usernames (no unique constraint)', async () => {
      // Create initial user
      await db.insert(users).values({
        email: 'user1@example.com',
        username: 'duplicate',
      });

      // Try to create user with same username - should succeed as username is not unique
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: {
          email: 'user2@example.com',
          username: 'duplicate',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.user.username).toBe('duplicate');
    });

    it('should handle malformed JSON payload', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        headers: {
          'content-type': 'application/json',
        },
        payload: 'invalid json',
      });

      // Should return 400 or similar error
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('should create multiple users with different data', async () => {
      const response1 = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: {
          email: 'user1@example.com',
          username: 'user1',
        },
      });

      const response2 = await app.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: {
          email: 'user2@example.com',
          username: 'user2',
        },
      });

      expect(response1.statusCode).toBe(201);
      expect(response2.statusCode).toBe(201);

      const allUsers = await db.select().from(users);
      expect(allUsers).toHaveLength(2);
    });
  });
});
