import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { createDb } from '@vtt/database';
import { users, sessions, campaigns, scenes, fogExploration } from '@vtt/database';
import { eq, and } from 'drizzle-orm';

describe('Fog of War Routes', () => {
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
    await db.delete(fogExploration);
    await db.delete(scenes);
    await db.delete(campaigns);
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

    // Create a test campaign
    const campaignResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/campaigns',
      headers: {
        authorization: `Bearer ${sessionId}`,
      },
      payload: {
        name: 'Test Campaign',
      },
    });

    const campaignBody = JSON.parse(campaignResponse.body);
    campaignId = campaignBody.campaign.id;

    // Create a test scene
    const [scene] = await db.insert(scenes).values({
      campaignId,
      name: 'Test Scene',
      width: 4000,
      height: 3000,
      gridSize: 100,
      data: {},
    }).returning();

    sceneId = scene.id;
  });

  describe('GET /api/v1/scenes/:sceneId/fog', () => {
    it('should create and return empty fog for new user/scene', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/fog`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.fog).toBeDefined();
      expect(body.fog.sceneId).toBe(sceneId);
      expect(body.fog.userId).toBe(userId);
      expect(body.fog.exploredGrid).toEqual([]);
      expect(body.fog.revealedGrid).toEqual([]);
      expect(body.fog.gridCellSize).toBe(50);
      expect(body.fog.id).toBeDefined();
      expect(body.fog.createdAt).toBeDefined();
      expect(body.fog.updatedAt).toBeDefined();
    });

    it('should return existing fog data for user', async () => {
      // Create existing fog exploration data
      const exploredGrid = [
        [true, true, false],
        [true, false, false],
      ];
      const revealedGrid = [
        [false, false, true],
        [false, false, false],
      ];

      await db.insert(fogExploration).values({
        sceneId,
        userId,
        exploredGrid,
        revealedGrid,
        gridCellSize: 50,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/fog`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.fog.sceneId).toBe(sceneId);
      expect(body.fog.userId).toBe(userId);
      expect(body.fog.exploredGrid).toEqual(exploredGrid);
      expect(body.fog.revealedGrid).toEqual(revealedGrid);
      expect(body.fog.gridCellSize).toBe(50);
    });

    it('should return fog with all properties', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/fog`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const fog = body.fog;

      expect(fog).toHaveProperty('id');
      expect(fog).toHaveProperty('sceneId');
      expect(fog).toHaveProperty('userId');
      expect(fog).toHaveProperty('exploredGrid');
      expect(fog).toHaveProperty('revealedGrid');
      expect(fog).toHaveProperty('gridCellSize');
      expect(fog).toHaveProperty('createdAt');
      expect(fog).toHaveProperty('updatedAt');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/fog`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/fog`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent scene', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/scenes/00000000-0000-0000-0000-000000000000/fog',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Scene not found');
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid scene ID format that might cause database errors
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/scenes/invalid-uuid-format/fog',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('should create separate fog data for different users', async () => {
      // Create a second user
      const secondUserResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test2@example.com',
          username: 'testuser2',
          password: 'password123',
        },
      });

      const secondUserBody = JSON.parse(secondUserResponse.body);
      const secondSessionId = secondUserBody.sessionId;

      // Get fog for first user
      const firstUserFog = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/fog`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Get fog for second user
      const secondUserFog = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/fog`,
        headers: {
          authorization: `Bearer ${secondSessionId}`,
        },
      });

      expect(firstUserFog.statusCode).toBe(200);
      expect(secondUserFog.statusCode).toBe(200);

      const firstFog = JSON.parse(firstUserFog.body).fog;
      const secondFog = JSON.parse(secondUserFog.body).fog;

      expect(firstFog.id).not.toBe(secondFog.id);
      expect(firstFog.userId).toBe(userId);
      expect(secondFog.userId).toBe(secondUserBody.user.id);
    });
  });

  describe('POST /api/v1/scenes/:sceneId/fog/explore', () => {
    it('should create new fog exploration with provided grid', async () => {
      const exploredGrid = [
        [true, true, false],
        [true, false, false],
      ];

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/explore`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          exploredGrid,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.fog.sceneId).toBe(sceneId);
      expect(body.fog.userId).toBe(userId);
      expect(body.fog.exploredGrid).toEqual(exploredGrid);
      expect(body.fog.revealedGrid).toEqual([]);
      expect(body.fog.gridCellSize).toBe(50);
    });

    it('should merge with existing exploration', async () => {
      // Create initial fog exploration
      const initialGrid = [
        [true, false, false],
        [false, false, false],
      ];

      await db.insert(fogExploration).values({
        sceneId,
        userId,
        exploredGrid: initialGrid,
        revealedGrid: [],
        gridCellSize: 50,
      });

      // Update with new exploration
      const newGrid = [
        [false, true, false],
        [false, true, false],
      ];

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/explore`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          exploredGrid: newGrid,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Grid should be merged (OR operation)
      const expectedMerged = [
        [true, true, false],
        [false, true, false],
      ];
      expect(body.fog.exploredGrid).toEqual(expectedMerged);
    });

    it('should handle grids of different sizes when merging', async () => {
      // Create initial fog exploration
      const initialGrid = [
        [true, false],
        [false, false],
      ];

      await db.insert(fogExploration).values({
        sceneId,
        userId,
        exploredGrid: initialGrid,
        revealedGrid: [],
        gridCellSize: 50,
      });

      // Update with larger grid
      const newGrid = [
        [false, true, true],
        [false, true, false],
        [true, false, false],
      ];

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/explore`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          exploredGrid: newGrid,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Grid should be merged and expanded
      const expectedMerged = [
        [true, true, true],
        [false, true, false],
        [true, false, false],
      ];
      expect(body.fog.exploredGrid).toEqual(expectedMerged);
    });

    it('should return updated fog state', async () => {
      const exploredGrid = [
        [true, true],
      ];

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/explore`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          exploredGrid,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.fog).toBeDefined();
      expect(body.fog.id).toBeDefined();
      expect(body.fog.exploredGrid).toEqual(exploredGrid);
      expect(body.fog.updatedAt).toBeDefined();
    });

    it('should return 400 if exploredGrid is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/explore`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('exploredGrid is required');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/explore`,
        payload: {
          exploredGrid: [[true]],
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/explore`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {
          exploredGrid: [[true]],
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent scene', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/scenes/00000000-0000-0000-0000-000000000000/fog/explore',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          exploredGrid: [[true]],
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Scene not found');
    });

    it('should handle empty explored grid', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/explore`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          exploredGrid: [],
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.fog.exploredGrid).toEqual([]);
    });

    it('should preserve revealedGrid when updating exploredGrid', async () => {
      // Create initial fog with revealed grid
      const revealedGrid = [
        [true, false],
        [false, true],
      ];

      await db.insert(fogExploration).values({
        sceneId,
        userId,
        exploredGrid: [],
        revealedGrid,
        gridCellSize: 50,
      });

      // Update explored grid
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/explore`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          exploredGrid: [[true]],
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.fog.revealedGrid).toEqual(revealedGrid);
    });
  });

  describe('POST /api/v1/scenes/:sceneId/fog/reveal', () => {
    beforeEach(async () => {
      // Create fog exploration data for testing
      await db.insert(fogExploration).values({
        sceneId,
        userId,
        exploredGrid: [],
        revealedGrid: [],
        gridCellSize: 50,
      });
    });

    it('should reveal area for all users', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/reveal`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 0,
          y: 0,
          width: 2,
          height: 2,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Area revealed');

      // Verify the fog was updated
      const [updatedFog] = await db
        .select()
        .from(fogExploration)
        .where(
          and(
            eq(fogExploration.sceneId, sceneId),
            eq(fogExploration.userId, userId)
          )
        )
        .limit(1);

      const revealedGrid = updatedFog.revealedGrid as boolean[][];
      expect(revealedGrid[0][0]).toBe(true);
      expect(revealedGrid[0][1]).toBe(true);
      expect(revealedGrid[1][0]).toBe(true);
      expect(revealedGrid[1][1]).toBe(true);
    });

    it('should reveal rectangular area correctly', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/reveal`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 1,
          y: 1,
          width: 3,
          height: 2,
        },
      });

      expect(response.statusCode).toBe(200);

      // Verify the specific area was revealed
      const [updatedFog] = await db
        .select()
        .from(fogExploration)
        .where(
          and(
            eq(fogExploration.sceneId, sceneId),
            eq(fogExploration.userId, userId)
          )
        )
        .limit(1);

      const revealedGrid = updatedFog.revealedGrid as boolean[][];
      // Check that the correct cells are revealed
      expect(revealedGrid[1][1]).toBe(true);
      expect(revealedGrid[1][2]).toBe(true);
      expect(revealedGrid[1][3]).toBe(true);
      expect(revealedGrid[2][1]).toBe(true);
      expect(revealedGrid[2][2]).toBe(true);
      expect(revealedGrid[2][3]).toBe(true);
    });

    it('should expand grid as needed to accommodate revealed area', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/reveal`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 5,
          y: 5,
          width: 2,
          height: 2,
        },
      });

      expect(response.statusCode).toBe(200);

      // Verify grid was expanded
      const [updatedFog] = await db
        .select()
        .from(fogExploration)
        .where(
          and(
            eq(fogExploration.sceneId, sceneId),
            eq(fogExploration.userId, userId)
          )
        )
        .limit(1);

      const revealedGrid = updatedFog.revealedGrid as boolean[][];
      expect(revealedGrid.length).toBeGreaterThanOrEqual(7);
      expect(revealedGrid[5][5]).toBe(true);
      expect(revealedGrid[6][6]).toBe(true);
    });

    it('should reveal area for multiple users', async () => {
      // Create a second user and their fog data
      const secondUserResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test2@example.com',
          username: 'testuser2',
          password: 'password123',
        },
      });

      const secondUserBody = JSON.parse(secondUserResponse.body);
      const secondUserId = secondUserBody.user.id;

      await db.insert(fogExploration).values({
        sceneId,
        userId: secondUserId,
        exploredGrid: [],
        revealedGrid: [],
        gridCellSize: 50,
      });

      // Reveal area
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/reveal`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 0,
          y: 0,
          width: 1,
          height: 1,
        },
      });

      expect(response.statusCode).toBe(200);

      // Verify both users have the revealed area
      const fogs = await db
        .select()
        .from(fogExploration)
        .where(eq(fogExploration.sceneId, sceneId));

      expect(fogs).toHaveLength(2);
      fogs.forEach(fog => {
        const revealedGrid = fog.revealedGrid as boolean[][];
        expect(revealedGrid[0][0]).toBe(true);
      });
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/reveal`,
        payload: {
          x: 0,
          y: 0,
          width: 1,
          height: 1,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/reveal`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {
          x: 0,
          y: 0,
          width: 1,
          height: 1,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent scene', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/scenes/00000000-0000-0000-0000-000000000000/fog/reveal',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 0,
          y: 0,
          width: 1,
          height: 1,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Scene not found');
    });

    it('should handle revealing already revealed areas', async () => {
      // Reveal area first time
      await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/reveal`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 0,
          y: 0,
          width: 2,
          height: 2,
        },
      });

      // Reveal same area again
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/reveal`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 0,
          y: 0,
          width: 2,
          height: 2,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });
  });

  describe('POST /api/v1/scenes/:sceneId/fog/hide', () => {
    beforeEach(async () => {
      // Create fog exploration data with revealed areas
      const revealedGrid = [
        [true, true, true, true],
        [true, true, true, true],
        [true, true, true, true],
        [true, true, true, true],
      ];

      await db.insert(fogExploration).values({
        sceneId,
        userId,
        exploredGrid: [],
        revealedGrid,
        gridCellSize: 50,
      });
    });

    it('should hide area for all users', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/hide`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 1,
          y: 1,
          width: 2,
          height: 2,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Area hidden');

      // Verify the fog was updated
      const [updatedFog] = await db
        .select()
        .from(fogExploration)
        .where(
          and(
            eq(fogExploration.sceneId, sceneId),
            eq(fogExploration.userId, userId)
          )
        )
        .limit(1);

      const revealedGrid = updatedFog.revealedGrid as boolean[][];
      expect(revealedGrid[1][1]).toBe(false);
      expect(revealedGrid[1][2]).toBe(false);
      expect(revealedGrid[2][1]).toBe(false);
      expect(revealedGrid[2][2]).toBe(false);
      // Other areas should still be revealed
      expect(revealedGrid[0][0]).toBe(true);
      expect(revealedGrid[3][3]).toBe(true);
    });

    it('should hide rectangular area correctly', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/hide`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 0,
          y: 0,
          width: 3,
          height: 1,
        },
      });

      expect(response.statusCode).toBe(200);

      // Verify the specific area was hidden
      const [updatedFog] = await db
        .select()
        .from(fogExploration)
        .where(
          and(
            eq(fogExploration.sceneId, sceneId),
            eq(fogExploration.userId, userId)
          )
        )
        .limit(1);

      const revealedGrid = updatedFog.revealedGrid as boolean[][];
      expect(revealedGrid[0][0]).toBe(false);
      expect(revealedGrid[0][1]).toBe(false);
      expect(revealedGrid[0][2]).toBe(false);
      // Other areas should still be revealed
      expect(revealedGrid[1][0]).toBe(true);
    });

    it('should not expand grid when hiding beyond current bounds', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/hide`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 10,
          y: 10,
          width: 2,
          height: 2,
        },
      });

      expect(response.statusCode).toBe(200);

      // Verify grid was not expanded
      const [updatedFog] = await db
        .select()
        .from(fogExploration)
        .where(
          and(
            eq(fogExploration.sceneId, sceneId),
            eq(fogExploration.userId, userId)
          )
        )
        .limit(1);

      const revealedGrid = updatedFog.revealedGrid as boolean[][];
      expect(revealedGrid.length).toBe(4);
    });

    it('should hide area for multiple users', async () => {
      // Create a second user and their fog data
      const secondUserResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test2@example.com',
          username: 'testuser2',
          password: 'password123',
        },
      });

      const secondUserBody = JSON.parse(secondUserResponse.body);
      const secondUserId = secondUserBody.user.id;

      const revealedGrid = [
        [true, true],
        [true, true],
      ];

      await db.insert(fogExploration).values({
        sceneId,
        userId: secondUserId,
        exploredGrid: [],
        revealedGrid,
        gridCellSize: 50,
      });

      // Hide area
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/hide`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 0,
          y: 0,
          width: 1,
          height: 1,
        },
      });

      expect(response.statusCode).toBe(200);

      // Verify both users have the hidden area
      const fogs = await db
        .select()
        .from(fogExploration)
        .where(eq(fogExploration.sceneId, sceneId));

      expect(fogs).toHaveLength(2);
      fogs.forEach(fog => {
        const revealedGrid = fog.revealedGrid as boolean[][];
        if (revealedGrid.length > 0 && revealedGrid[0].length > 0) {
          expect(revealedGrid[0][0]).toBe(false);
        }
      });
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/hide`,
        payload: {
          x: 0,
          y: 0,
          width: 1,
          height: 1,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/hide`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {
          x: 0,
          y: 0,
          width: 1,
          height: 1,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent scene', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/scenes/00000000-0000-0000-0000-000000000000/fog/hide',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 0,
          y: 0,
          width: 1,
          height: 1,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Scene not found');
    });

    it('should handle hiding already hidden areas', async () => {
      // Hide area first time
      await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/hide`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 1,
          y: 1,
          width: 1,
          height: 1,
        },
      });

      // Hide same area again
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/hide`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 1,
          y: 1,
          width: 1,
          height: 1,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });
  });

  describe('POST /api/v1/scenes/:sceneId/fog/reset', () => {
    beforeEach(async () => {
      // Create fog exploration data
      const exploredGrid = [
        [true, true, false],
        [true, false, false],
      ];
      const revealedGrid = [
        [false, false, true],
        [false, false, false],
      ];

      await db.insert(fogExploration).values({
        sceneId,
        userId,
        exploredGrid,
        revealedGrid,
        gridCellSize: 50,
      });
    });

    it('should reset fog for all users in scene', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/reset`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Fog reset');

      // Verify fog was reset
      const [resetFog] = await db
        .select()
        .from(fogExploration)
        .where(
          and(
            eq(fogExploration.sceneId, sceneId),
            eq(fogExploration.userId, userId)
          )
        )
        .limit(1);

      expect(resetFog.exploredGrid).toEqual([]);
      expect(resetFog.revealedGrid).toEqual([]);
    });

    it('should reset fog for multiple users', async () => {
      // Create a second user and their fog data
      const secondUserResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test2@example.com',
          username: 'testuser2',
          password: 'password123',
        },
      });

      const secondUserBody = JSON.parse(secondUserResponse.body);
      const secondUserId = secondUserBody.user.id;

      await db.insert(fogExploration).values({
        sceneId,
        userId: secondUserId,
        exploredGrid: [[true, true]],
        revealedGrid: [[false, true]],
        gridCellSize: 50,
      });

      // Reset fog
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/reset`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);

      // Verify all users' fog was reset
      const fogs = await db
        .select()
        .from(fogExploration)
        .where(eq(fogExploration.sceneId, sceneId));

      expect(fogs).toHaveLength(2);
      fogs.forEach(fog => {
        expect(fog.exploredGrid).toEqual([]);
        expect(fog.revealedGrid).toEqual([]);
      });
    });

    it('should update updatedAt timestamp', async () => {
      const beforeReset = new Date();

      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/reset`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const [resetFog] = await db
        .select()
        .from(fogExploration)
        .where(
          and(
            eq(fogExploration.sceneId, sceneId),
            eq(fogExploration.userId, userId)
          )
        )
        .limit(1);

      expect(resetFog.updatedAt.getTime()).toBeGreaterThan(beforeReset.getTime());
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/reset`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/reset`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent scene', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/scenes/00000000-0000-0000-0000-000000000000/fog/reset',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Scene not found');
    });

    it('should handle resetting when no fog data exists', async () => {
      // Delete all fog exploration data
      await db.delete(fogExploration);

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/reset`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    it('should only reset fog for the specified scene', async () => {
      // Create a second scene
      const [secondScene] = await db.insert(scenes).values({
        campaignId,
        name: 'Second Scene',
        width: 4000,
        height: 3000,
        gridSize: 100,
        data: {},
      }).returning();

      // Create fog data for second scene
      await db.insert(fogExploration).values({
        sceneId: secondScene.id,
        userId,
        exploredGrid: [[true, true]],
        revealedGrid: [[true, false]],
        gridCellSize: 50,
      });

      // Reset fog for first scene only
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/fog/reset`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);

      // Verify first scene fog was reset
      const [firstSceneFog] = await db
        .select()
        .from(fogExploration)
        .where(
          and(
            eq(fogExploration.sceneId, sceneId),
            eq(fogExploration.userId, userId)
          )
        )
        .limit(1);

      expect(firstSceneFog.exploredGrid).toEqual([]);

      // Verify second scene fog was NOT reset
      const [secondSceneFog] = await db
        .select()
        .from(fogExploration)
        .where(
          and(
            eq(fogExploration.sceneId, secondScene.id),
            eq(fogExploration.userId, userId)
          )
        )
        .limit(1);

      expect(secondSceneFog.exploredGrid).toEqual([[true, true]]);
    });
  });
});
