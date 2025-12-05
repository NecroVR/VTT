import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { createDb } from '@vtt/database';
import { users, sessions, campaigns, scenes } from '@vtt/database';
import { eq } from 'drizzle-orm';

describe('Scenes Routes', () => {
  let app: FastifyInstance;
  let db: ReturnType<typeof createDb>;
  let sessionId: string;
  let userId: string;
  let campaignId: string;

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
  });

  describe('POST /api/v1/campaigns/:campaignId/scenes', () => {
    it('should create a new scene with minimal data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/scenes`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Test Scene',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('scene');
      expect(body.scene.name).toBe('Test Scene');
      expect(body.scene.campaignId).toBe(campaignId);
      expect(body.scene.active).toBe(false);
      expect(body.scene.gridType).toBe('square');
      expect(body.scene.gridSize).toBe(100);
    });

    it('should create a scene with full data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/scenes`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Full Scene',
          active: true,
          backgroundImage: 'https://example.com/bg.jpg',
          backgroundWidth: 1920,
          backgroundHeight: 1080,
          gridType: 'hex',
          gridSize: 50,
          gridColor: '#FF0000',
          gridAlpha: 0.5,
          gridDistance: 10,
          gridUnits: 'm',
          tokenVision: false,
          fogExploration: false,
          globalLight: false,
          darkness: 0.5,
          initialX: 100,
          initialY: 200,
          initialScale: 1.5,
          navOrder: 1,
          data: { custom: 'value' },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.scene.name).toBe('Full Scene');
      expect(body.scene.active).toBe(true);
      expect(body.scene.backgroundImage).toBe('https://example.com/bg.jpg');
      expect(body.scene.backgroundWidth).toBe(1920);
      expect(body.scene.backgroundHeight).toBe(1080);
      expect(body.scene.gridType).toBe('hex');
      expect(body.scene.gridSize).toBe(50);
      expect(body.scene.gridColor).toBe('#FF0000');
      expect(body.scene.gridAlpha).toBe(0.5);
      expect(body.scene.gridDistance).toBe(10);
      expect(body.scene.gridUnits).toBe('m');
      expect(body.scene.tokenVision).toBe(false);
      expect(body.scene.fogExploration).toBe(false);
      expect(body.scene.globalLight).toBe(false);
      expect(body.scene.darkness).toBe(0.5);
      expect(body.scene.initialX).toBe(100);
      expect(body.scene.initialY).toBe(200);
      expect(body.scene.initialScale).toBe(1.5);
      expect(body.scene.navOrder).toBe(1);
      expect(body.scene.data).toEqual({ custom: 'value' });
    });

    it('should return 404 if campaign does not exist', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns/00000000-0000-0000-0000-000000000000/scenes',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Test Scene',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Campaign not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/scenes`,
        payload: {
          name: 'Test Scene',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/scenes`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {
          name: 'Test Scene',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/campaigns/:campaignId/scenes', () => {
    beforeEach(async () => {
      // Create test scenes
      await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/scenes`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Scene 1',
        },
      });

      await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/scenes`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Scene 2',
          active: true,
        },
      });
    });

    it('should list all scenes for a campaign', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}/scenes`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.scenes).toHaveLength(2);
      expect(body.scenes[0].name).toBe('Scene 1');
      expect(body.scenes[1].name).toBe('Scene 2');
      expect(body.scenes[0].campaignId).toBe(campaignId);
      expect(body.scenes[1].campaignId).toBe(campaignId);
    });

    it('should return empty array if campaign has no scenes', async () => {
      await db.delete(scenes);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}/scenes`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.scenes).toHaveLength(0);
    });

    it('should return 404 if campaign does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/campaigns/00000000-0000-0000-0000-000000000000/scenes',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Campaign not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}/scenes`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}/scenes`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/scenes/:sceneId', () => {
    let sceneId: string;

    beforeEach(async () => {
      // Create a test scene
      const sceneResponse = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/scenes`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Test Scene',
          active: true,
        },
      });

      const sceneBody = JSON.parse(sceneResponse.body);
      sceneId = sceneBody.scene.id;
    });

    it('should get a scene by ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.scene.id).toBe(sceneId);
      expect(body.scene.name).toBe('Test Scene');
      expect(body.scene.campaignId).toBe(campaignId);
      expect(body.scene.active).toBe(true);
    });

    it('should return 404 if scene does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/scenes/00000000-0000-0000-0000-000000000000',
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
        url: `/api/v1/scenes/${sceneId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/v1/scenes/:sceneId', () => {
    let sceneId: string;

    beforeEach(async () => {
      // Create a test scene
      const sceneResponse = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/scenes`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Test Scene',
          active: false,
          gridSize: 100,
        },
      });

      const sceneBody = JSON.parse(sceneResponse.body);
      sceneId = sceneBody.scene.id;
    });

    it('should update scene name', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/scenes/${sceneId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Updated Scene',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.scene.name).toBe('Updated Scene');
      expect(body.scene.id).toBe(sceneId);
    });

    it('should update scene active status', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/scenes/${sceneId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          active: true,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.scene.active).toBe(true);
    });

    it('should update multiple scene properties', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/scenes/${sceneId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Updated Scene',
          active: true,
          gridSize: 50,
          gridType: 'hex',
          darkness: 0.7,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.scene.name).toBe('Updated Scene');
      expect(body.scene.active).toBe(true);
      expect(body.scene.gridSize).toBe(50);
      expect(body.scene.gridType).toBe('hex');
      expect(body.scene.darkness).toBe(0.7);
    });

    it('should update scene background settings', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/scenes/${sceneId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          backgroundImage: 'https://example.com/new-bg.jpg',
          backgroundWidth: 2560,
          backgroundHeight: 1440,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.scene.backgroundImage).toBe('https://example.com/new-bg.jpg');
      expect(body.scene.backgroundWidth).toBe(2560);
      expect(body.scene.backgroundHeight).toBe(1440);
    });

    it('should return 404 if scene does not exist', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/scenes/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Updated Scene',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Scene not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/scenes/${sceneId}`,
        payload: {
          name: 'Updated Scene',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/scenes/${sceneId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {
          name: 'Updated Scene',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/v1/scenes/:sceneId', () => {
    let sceneId: string;

    beforeEach(async () => {
      // Create a test scene
      const sceneResponse = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/scenes`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Test Scene',
        },
      });

      const sceneBody = JSON.parse(sceneResponse.body);
      sceneId = sceneBody.scene.id;
    });

    it('should delete a scene', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/scenes/${sceneId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify scene is deleted from database
      const [deletedScene] = await db
        .select()
        .from(scenes)
        .where(eq(scenes.id, sceneId))
        .limit(1);

      expect(deletedScene).toBeUndefined();
    });

    it('should return 404 if scene does not exist', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/scenes/00000000-0000-0000-0000-000000000000',
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
        method: 'DELETE',
        url: `/api/v1/scenes/${sceneId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/scenes/${sceneId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
