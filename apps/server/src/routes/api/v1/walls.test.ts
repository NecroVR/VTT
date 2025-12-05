import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { createDb } from '@vtt/database';
import { users, sessions, games, scenes, walls } from '@vtt/database';
import { eq } from 'drizzle-orm';

describe('Walls Routes', () => {
  let app: FastifyInstance;
  let db: ReturnType<typeof createDb>;
  let sessionId: string;
  let userId: string;
  let campaignId: string;
  let sceneId: string;

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
    await db.delete(walls);
    await db.delete(scenes);
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

    // Create a test game
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

    // Create a test scene
    const [scene] = await db.insert(scenes).values({
      campaignId,
      name: 'Test Scene',
      width: 4000,
      height: 3000,
      backgroundColor: '#999999',
      gridType: 'square',
      gridSize: 100,
      padding: 0.25,
      data: {},
    }).returning();

    sceneId = scene.id;
  });

  describe('GET /api/v1/scenes/:sceneId/walls', () => {
    beforeEach(async () => {
      // Create test walls directly in database
      await db.insert(walls).values([
        {
          sceneId,
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 0,
          wallType: 'normal',
          move: 'block',
          sense: 'block',
          sound: 'block',
          door: 'none',
          doorState: 'closed',
          data: {},
        },
        {
          sceneId,
          x1: 100,
          y1: 0,
          x2: 100,
          y2: 100,
          wallType: 'normal',
          move: 'block',
          sense: 'normal',
          sound: 'normal',
          door: 'door',
          doorState: 'closed',
          data: { locked: true },
        },
      ]);
    });

    it('should list all walls for a scene', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/walls`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.walls).toHaveLength(2);
      expect(body.walls[0].sceneId).toBe(sceneId);
      expect(body.walls[1].sceneId).toBe(sceneId);
    });

    it('should return wall with all properties', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/walls`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const wall = body.walls[0];

      expect(wall).toHaveProperty('id');
      expect(wall).toHaveProperty('sceneId');
      expect(wall).toHaveProperty('x1');
      expect(wall).toHaveProperty('y1');
      expect(wall).toHaveProperty('x2');
      expect(wall).toHaveProperty('y2');
      expect(wall).toHaveProperty('wallType');
      expect(wall).toHaveProperty('move');
      expect(wall).toHaveProperty('sense');
      expect(wall).toHaveProperty('sound');
      expect(wall).toHaveProperty('door');
      expect(wall).toHaveProperty('doorState');
      expect(wall).toHaveProperty('data');
      expect(wall).toHaveProperty('createdAt');
    });

    it('should return wall with correct values', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/walls`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const wall = body.walls[0];

      expect(wall.x1).toBe(0);
      expect(wall.y1).toBe(0);
      expect(wall.x2).toBe(100);
      expect(wall.y2).toBe(0);
      expect(wall.wallType).toBe('normal');
      expect(wall.move).toBe('block');
      expect(wall.sense).toBe('block');
      expect(wall.sound).toBe('block');
      expect(wall.door).toBe('none');
      expect(wall.doorState).toBe('closed');
      expect(wall.data).toEqual({});
    });

    it('should return wall with door properties', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/walls`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const doorWall = body.walls[1];

      expect(doorWall.door).toBe('door');
      expect(doorWall.doorState).toBe('closed');
      expect(doorWall.data).toEqual({ locked: true });
    });

    it('should return empty array if scene has no walls', async () => {
      await db.delete(walls);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/walls`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.walls).toHaveLength(0);
    });

    it('should return 404 if scene does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/scenes/00000000-0000-0000-0000-000000000000/walls',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Scene not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/walls`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/walls`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid scene ID format that might cause database errors
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/scenes/invalid-uuid-format/walls',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/v1/walls/:wallId', () => {
    let wallId: string;

    beforeEach(async () => {
      // Create a test wall directly in database
      const [wall] = await db.insert(walls).values({
        sceneId,
        x1: 50,
        y1: 50,
        x2: 150,
        y2: 150,
        wallType: 'normal',
        move: 'block',
        sense: 'block',
        sound: 'block',
        door: 'none',
        doorState: 'closed',
        data: { test: 'value' },
      }).returning();

      wallId = wall.id;
    });

    it('should get a wall by ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/walls/${wallId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.wall.id).toBe(wallId);
      expect(body.wall.sceneId).toBe(sceneId);
      expect(body.wall.x1).toBe(50);
      expect(body.wall.y1).toBe(50);
      expect(body.wall.x2).toBe(150);
      expect(body.wall.y2).toBe(150);
    });

    it('should return wall with all properties', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/walls/${wallId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const wall = body.wall;

      expect(wall.id).toBe(wallId);
      expect(wall.sceneId).toBe(sceneId);
      expect(wall.wallType).toBe('normal');
      expect(wall.move).toBe('block');
      expect(wall.sense).toBe('block');
      expect(wall.sound).toBe('block');
      expect(wall.door).toBe('none');
      expect(wall.doorState).toBe('closed');
      expect(wall.data).toEqual({ test: 'value' });
    });

    it('should return 404 if wall does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/walls/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Wall not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/walls/${wallId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/walls/${wallId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid wall ID format that might cause database errors
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/walls/invalid-uuid-format',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/v1/scenes/:sceneId/walls', () => {
    it('should create a new wall', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/walls`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 100,
          wallType: 'normal',
          move: 'block',
          sense: 'block',
          sound: 'block',
          door: 'none',
          doorState: 'closed',
          data: { custom: 'data' },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.wall.sceneId).toBe(sceneId);
      expect(body.wall.x1).toBe(0);
      expect(body.wall.y1).toBe(0);
      expect(body.wall.x2).toBe(100);
      expect(body.wall.y2).toBe(100);
      expect(body.wall.wallType).toBe('normal');
      expect(body.wall.move).toBe('block');
      expect(body.wall.sense).toBe('block');
      expect(body.wall.sound).toBe('block');
      expect(body.wall.door).toBe('none');
      expect(body.wall.doorState).toBe('closed');
      expect(body.wall.data).toEqual({ custom: 'data' });
    });

    it('should create wall with minimal fields and defaults', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/walls`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x1: 10,
          y1: 20,
          x2: 30,
          y2: 40,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.wall.sceneId).toBe(sceneId);
      expect(body.wall.x1).toBe(10);
      expect(body.wall.y1).toBe(20);
      expect(body.wall.x2).toBe(30);
      expect(body.wall.y2).toBe(40);
      expect(body.wall.wallType).toBe('normal');
      expect(body.wall.move).toBe('block');
      expect(body.wall.sense).toBe('block');
      expect(body.wall.sound).toBe('block');
      expect(body.wall.door).toBe('none');
      expect(body.wall.doorState).toBe('closed');
      expect(body.wall.data).toEqual({});
    });

    it('should create door wall with door properties', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/walls`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 0,
          door: 'door',
          doorState: 'open',
          data: { locked: false },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.wall.door).toBe('door');
      expect(body.wall.doorState).toBe('open');
      expect(body.wall.data).toEqual({ locked: false });
    });

    it('should return 400 if x1 is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/walls`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          y1: 0,
          x2: 100,
          y2: 100,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('x1 coordinate is required and must be a number');
    });

    it('should return 400 if y1 is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/walls`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x1: 0,
          x2: 100,
          y2: 100,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('y1 coordinate is required and must be a number');
    });

    it('should return 400 if x2 is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/walls`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x1: 0,
          y1: 0,
          y2: 100,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('x2 coordinate is required and must be a number');
    });

    it('should return 400 if y2 is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/walls`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x1: 0,
          y1: 0,
          x2: 100,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('y2 coordinate is required and must be a number');
    });

    it('should return 400 if x1 is not a number', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/walls`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x1: 'not-a-number',
          y1: 0,
          x2: 100,
          y2: 100,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('x1 coordinate is required and must be a number');
    });

    it('should return 404 if scene does not exist', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/scenes/00000000-0000-0000-0000-000000000000/walls',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 100,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Scene not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/walls`,
        payload: {
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 100,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/walls`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 100,
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/v1/walls/:wallId', () => {
    let wallId: string;

    beforeEach(async () => {
      // Create a test wall directly in database
      const [wall] = await db.insert(walls).values({
        sceneId,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        wallType: 'normal',
        move: 'block',
        sense: 'block',
        sound: 'block',
        door: 'none',
        doorState: 'closed',
        data: { version: 1 },
      }).returning();

      wallId = wall.id;
    });

    it('should update wall coordinates', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/walls/${wallId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x1: 50,
          y1: 50,
          x2: 150,
          y2: 150,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.wall.x1).toBe(50);
      expect(body.wall.y1).toBe(50);
      expect(body.wall.x2).toBe(150);
      expect(body.wall.y2).toBe(150);
    });

    it('should update wall properties', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/walls/${wallId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          wallType: 'invisible',
          move: 'normal',
          sense: 'normal',
          sound: 'normal',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.wall.wallType).toBe('invisible');
      expect(body.wall.move).toBe('normal');
      expect(body.wall.sense).toBe('normal');
      expect(body.wall.sound).toBe('normal');
    });

    it('should update door properties', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/walls/${wallId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          door: 'door',
          doorState: 'open',
          data: { locked: false },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.wall.door).toBe('door');
      expect(body.wall.doorState).toBe('open');
      expect(body.wall.data).toEqual({ locked: false });
    });

    it('should update multiple fields', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/walls/${wallId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x1: 10,
          y1: 20,
          wallType: 'terrain',
          move: 'normal',
          door: 'secret',
          doorState: 'locked',
          data: { version: 2, new: 'field' },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.wall.x1).toBe(10);
      expect(body.wall.y1).toBe(20);
      expect(body.wall.wallType).toBe('terrain');
      expect(body.wall.move).toBe('normal');
      expect(body.wall.door).toBe('secret');
      expect(body.wall.doorState).toBe('locked');
      expect(body.wall.data).toEqual({ version: 2, new: 'field' });
    });

    it('should return 400 if x1 is not a number', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/walls/${wallId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x1: 'not-a-number',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('x1 must be a number');
    });

    it('should return 400 if y1 is not a number', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/walls/${wallId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          y1: 'not-a-number',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('y1 must be a number');
    });

    it('should return 400 if x2 is not a number', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/walls/${wallId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x2: 'not-a-number',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('x2 must be a number');
    });

    it('should return 400 if y2 is not a number', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/walls/${wallId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          y2: 'not-a-number',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('y2 must be a number');
    });

    it('should return 404 if wall does not exist', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/walls/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x1: 50,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Wall not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/walls/${wallId}`,
        payload: {
          x1: 50,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/walls/${wallId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {
          x1: 50,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid wall ID format that might cause database errors
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/walls/invalid-uuid-format',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x1: 50,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('DELETE /api/v1/walls/:wallId', () => {
    let wallId: string;

    beforeEach(async () => {
      // Create a test wall directly in database
      const [wall] = await db.insert(walls).values({
        sceneId,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        wallType: 'normal',
        move: 'block',
        sense: 'block',
        sound: 'block',
        door: 'none',
        doorState: 'closed',
        data: {},
      }).returning();

      wallId = wall.id;
    });

    it('should delete a wall', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/walls/${wallId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify wall was deleted
      const [deletedWall] = await db
        .select()
        .from(walls)
        .where(eq(walls.id, wallId))
        .limit(1);

      expect(deletedWall).toBeUndefined();
    });

    it('should return 404 if wall does not exist', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/walls/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Wall not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/walls/${wallId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/walls/${wallId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid wall ID format that might cause database errors
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/walls/invalid-uuid-format',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });
});
