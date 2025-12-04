import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { createDb } from '@vtt/database';
import { users, sessions, games } from '@vtt/database';
import { eq } from 'drizzle-orm';

describe('Games Routes', () => {
  let app: FastifyInstance;
  let db: ReturnType<typeof createDb>;
  let sessionId: string;
  let userId: string;
  let otherSessionId: string;
  let otherUserId: string;

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
    await db.delete(games);
    await db.delete(sessions);
    await db.delete(users);

    // Create a test user and session
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      },
    });

    const registerBody = JSON.parse(registerResponse.body);
    sessionId = registerBody.sessionId;
    userId = registerBody.user.id;

    // Create a second test user
    const otherRegisterResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'other@example.com',
        username: 'otheruser',
        password: 'password123',
      },
    });

    const otherRegisterBody = JSON.parse(otherRegisterResponse.body);
    otherSessionId = otherRegisterBody.sessionId;
    otherUserId = otherRegisterBody.user.id;
  });

  describe('POST /api/v1/games', () => {
    it('should create a new game with valid data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/games',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Test Game',
          settings: {
            gridType: 'hex',
            gridSize: 75,
            snapToGrid: false,
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('game');
      expect(body.game.name).toBe('Test Game');
      expect(body.game.ownerId).toBe(userId);
      expect(body.game.settings.gridType).toBe('hex');
      expect(body.game.settings.gridSize).toBe(75);
      expect(body.game.settings.snapToGrid).toBe(false);
    });

    it('should create a game with default settings', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/games',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Test Game',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.game.settings.gridType).toBe('square');
      expect(body.game.settings.gridSize).toBe(50);
      expect(body.game.settings.snapToGrid).toBe(true);
    });

    it('should trim whitespace from game name', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/games',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: '  Test Game  ',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.game.name).toBe('Test Game');
    });

    it('should return 400 if name is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/games',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Game name is required');
    });

    it('should return 400 if name is empty string', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/games',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: '',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Game name is required');
    });

    it('should return 400 if name is only whitespace', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/games',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: '   ',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Game name is required');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/games',
        payload: {
          name: 'Test Game',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/games',
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {
          name: 'Test Game',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/games', () => {
    beforeEach(async () => {
      // Create games for test user
      await app.inject({
        method: 'POST',
        url: '/api/v1/games',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Game 1',
        },
      });

      await app.inject({
        method: 'POST',
        url: '/api/v1/games',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Game 2',
        },
      });

      // Create game for other user
      await app.inject({
        method: 'POST',
        url: '/api/v1/games',
        headers: {
          authorization: `Bearer ${otherSessionId}`,
        },
        payload: {
          name: 'Other User Game',
        },
      });
    });

    it('should list games owned by the authenticated user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/games',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.games).toHaveLength(2);
      expect(body.games[0].name).toBe('Game 1');
      expect(body.games[1].name).toBe('Game 2');
      expect(body.games[0].ownerId).toBe(userId);
      expect(body.games[1].ownerId).toBe(userId);
    });

    it('should not include games owned by other users', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/games',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.games).toHaveLength(2);
      expect(body.games.every((g: any) => g.name !== 'Other User Game')).toBe(true);
    });

    it('should return empty array if user has no games', async () => {
      // Clean up all games
      await db.delete(games);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/games',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.games).toHaveLength(0);
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/games',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/games',
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/games/:id', () => {
    let gameId: string;
    let otherGameId: string;

    beforeEach(async () => {
      // Create game for test user
      const gameResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/games',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Test Game',
        },
      });
      const gameBody = JSON.parse(gameResponse.body);
      gameId = gameBody.game.id;

      // Create game for other user
      const otherGameResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/games',
        headers: {
          authorization: `Bearer ${otherSessionId}`,
        },
        payload: {
          name: 'Other User Game',
        },
      });
      const otherGameBody = JSON.parse(otherGameResponse.body);
      otherGameId = otherGameBody.game.id;
    });

    it('should get a game by ID when user is the owner', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/games/${gameId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.game.id).toBe(gameId);
      expect(body.game.name).toBe('Test Game');
      expect(body.game.ownerId).toBe(userId);
    });

    it('should return 404 if game does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/games/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Game not found');
    });

    it('should return 403 if user is not the owner', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/games/${otherGameId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Access denied');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/games/${gameId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/games/${gameId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/v1/games/:id', () => {
    let gameId: string;
    let otherGameId: string;

    beforeEach(async () => {
      // Create game for test user
      const gameResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/games',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Test Game',
          settings: {
            gridType: 'square',
            gridSize: 50,
            snapToGrid: true,
          },
        },
      });
      const gameBody = JSON.parse(gameResponse.body);
      gameId = gameBody.game.id;

      // Create game for other user
      const otherGameResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/games',
        headers: {
          authorization: `Bearer ${otherSessionId}`,
        },
        payload: {
          name: 'Other User Game',
        },
      });
      const otherGameBody = JSON.parse(otherGameResponse.body);
      otherGameId = otherGameBody.game.id;
    });

    it('should update game name', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/games/${gameId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Updated Game Name',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.game.name).toBe('Updated Game Name');
      expect(body.game.id).toBe(gameId);
    });

    it('should update game settings', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/games/${gameId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          settings: {
            gridType: 'hex',
            gridSize: 100,
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.game.settings.gridType).toBe('hex');
      expect(body.game.settings.gridSize).toBe(100);
      expect(body.game.settings.snapToGrid).toBe(true); // Should preserve existing setting
    });

    it('should update both name and settings', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/games/${gameId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Updated Name',
          settings: {
            gridType: 'hex',
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.game.name).toBe('Updated Name');
      expect(body.game.settings.gridType).toBe('hex');
    });

    it('should trim whitespace from updated name', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/games/${gameId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: '  Updated Name  ',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.game.name).toBe('Updated Name');
    });

    it('should return 400 if no fields are provided', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/games/${gameId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('At least one field (name or settings) is required');
    });

    it('should return 400 if name is empty', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/games/${gameId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: '',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('At least one field (name or settings) is required');
    });

    it('should return 400 if name is only whitespace', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/games/${gameId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: '   ',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Game name cannot be empty');
    });

    it('should return 404 if game does not exist', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/games/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Game not found');
    });

    it('should return 403 if user is not the owner', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/games/${otherGameId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Only the owner can update this game');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/games/${gameId}`,
        payload: {
          name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/games/${gameId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {
          name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/v1/games/:id', () => {
    let gameId: string;
    let otherGameId: string;

    beforeEach(async () => {
      // Create game for test user
      const gameResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/games',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Test Game',
        },
      });
      const gameBody = JSON.parse(gameResponse.body);
      gameId = gameBody.game.id;

      // Create game for other user
      const otherGameResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/games',
        headers: {
          authorization: `Bearer ${otherSessionId}`,
        },
        payload: {
          name: 'Other User Game',
        },
      });
      const otherGameBody = JSON.parse(otherGameResponse.body);
      otherGameId = otherGameBody.game.id;
    });

    it('should delete a game when user is the owner', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/games/${gameId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);

      // Verify game is deleted from database
      const [deletedGame] = await db
        .select()
        .from(games)
        .where(eq(games.id, gameId))
        .limit(1);

      expect(deletedGame).toBeUndefined();
    });

    it('should return 404 if game does not exist', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/games/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Game not found');
    });

    it('should return 403 if user is not the owner', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/games/${otherGameId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Only the owner can delete this game');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/games/${gameId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/games/${gameId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
