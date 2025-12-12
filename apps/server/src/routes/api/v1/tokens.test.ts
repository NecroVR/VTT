import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { createDb } from '@vtt/database';
import { users, sessions, campaigns, scenes, tokens } from '@vtt/database';
import { eq } from 'drizzle-orm';

describe('Tokens Routes', () => {
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
    await db.delete(tokens);
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
      payload: { name: 'Test Campaign', gameSystemId: 'dnd5e-ogl' },
    });

    const campaignBody = JSON.parse(campaignResponse.body);
    campaignId = campaignBody.campaign.id;

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

  describe('GET /api/v1/scenes/:sceneId/tokens', () => {
    beforeEach(async () => {
      // Create test tokens directly in database
      await db.insert(tokens).values([
        {
          sceneId,
          name: 'Token 1',
          x: 100,
          y: 200,
          width: 50,
          height: 50,
          elevation: 0,
          rotation: 0,
          locked: false,
          ownerId: userId,
          visible: true,
          vision: true,
          visionRange: 30,
          bars: {},
          lightBright: 10,
          lightDim: 20,
          lightColor: '#FFFFFF',
          lightAngle: 360,
          data: {},
        },
        {
          sceneId,
          name: 'Token 2',
          x: 300,
          y: 400,
          width: 100,
          height: 100,
          elevation: 5,
          rotation: 45,
          locked: true,
          ownerId: userId,
          visible: false,
          vision: false,
          visionRange: 0,
          bars: { hp: { value: 50, max: 100 } },
          lightBright: 0,
          lightDim: 0,
          lightColor: null,
          lightAngle: 360,
          data: { custom: 'value' },
        },
      ]);
    });

    it('should list all tokens for a scene', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/tokens`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.tokens).toHaveLength(2);
      expect(body.tokens[0].name).toBe('Token 1');
      expect(body.tokens[1].name).toBe('Token 2');
      expect(body.tokens[0].sceneId).toBe(sceneId);
      expect(body.tokens[1].sceneId).toBe(sceneId);
    });

    it('should return token with all properties', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/tokens`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const token = body.tokens[0];

      expect(token).toHaveProperty('id');
      expect(token).toHaveProperty('sceneId');
      expect(token).toHaveProperty('name');
      expect(token).toHaveProperty('x');
      expect(token).toHaveProperty('y');
      expect(token).toHaveProperty('width');
      expect(token).toHaveProperty('height');
      expect(token).toHaveProperty('elevation');
      expect(token).toHaveProperty('rotation');
      expect(token).toHaveProperty('locked');
      expect(token).toHaveProperty('ownerId');
      expect(token).toHaveProperty('visible');
      expect(token).toHaveProperty('vision');
      expect(token).toHaveProperty('visionRange');
      expect(token).toHaveProperty('bars');
      expect(token).toHaveProperty('lightBright');
      expect(token).toHaveProperty('lightDim');
      expect(token).toHaveProperty('lightColor');
      expect(token).toHaveProperty('lightAngle');
      expect(token).toHaveProperty('data');
      expect(token).toHaveProperty('createdAt');
      expect(token).toHaveProperty('updatedAt');
    });

    it('should return token with correct values', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/tokens`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const token = body.tokens[1]; // Token 2

      expect(token.name).toBe('Token 2');
      expect(token.x).toBe(300);
      expect(token.y).toBe(400);
      expect(token.width).toBe(100);
      expect(token.height).toBe(100);
      expect(token.elevation).toBe(5);
      expect(token.rotation).toBe(45);
      expect(token.locked).toBe(true);
      expect(token.ownerId).toBe(userId);
      expect(token.visible).toBe(false);
      expect(token.vision).toBe(false);
      expect(token.visionRange).toBe(0);
      expect(token.bars).toEqual({ hp: { value: 50, max: 100 } });
      expect(token.lightBright).toBe(0);
      expect(token.lightDim).toBe(0);
      expect(token.lightColor).toBeNull();
      expect(token.lightAngle).toBe(360);
      expect(token.data).toEqual({ custom: 'value' });
    });

    it('should return empty array if scene has no tokens', async () => {
      await db.delete(tokens);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/tokens`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.tokens).toHaveLength(0);
    });

    it('should return 404 if scene does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/scenes/00000000-0000-0000-0000-000000000000/tokens',
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
        url: `/api/v1/scenes/${sceneId}/tokens`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/tokens`,
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
        url: '/api/v1/scenes/invalid-uuid-format/tokens',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/v1/scenes/:sceneId/tokens/:tokenId', () => {
    let tokenId: string;

    beforeEach(async () => {
      // Create a test token directly in database
      const [token] = await db.insert(tokens).values({
        sceneId,
        name: 'Test Token',
        x: 100,
        y: 200,
        width: 50,
        height: 50,
        elevation: 0,
        rotation: 0,
        locked: false,
        ownerId: userId,
        visible: true,
        vision: true,
        visionRange: 30,
        bars: { hp: { value: 100, max: 100 } },
        lightBright: 10,
        lightDim: 20,
        lightColor: '#FFFFFF',
        lightAngle: 360,
        data: { custom: 'data' },
      }).returning();

      tokenId = token.id;
    });

    it('should get a token by ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/tokens/${tokenId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.token.id).toBe(tokenId);
      expect(body.token.name).toBe('Test Token');
      expect(body.token.sceneId).toBe(sceneId);
      expect(body.token.x).toBe(100);
      expect(body.token.y).toBe(200);
    });

    it('should return token with all properties', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/tokens/${tokenId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const token = body.token;

      expect(token.id).toBe(tokenId);
      expect(token.sceneId).toBe(sceneId);
      expect(token.name).toBe('Test Token');
      expect(token.bars).toEqual({ hp: { value: 100, max: 100 } });
      expect(token.data).toEqual({ custom: 'data' });
      expect(token.lightBright).toBe(10);
      expect(token.lightDim).toBe(20);
      expect(token.lightColor).toBe('#FFFFFF');
      expect(token.lightAngle).toBe(360);
    });

    it('should return 404 if token does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/tokens/00000000-0000-0000-0000-000000000000`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Token not found');
    });

    it('should return 404 if token exists but sceneId does not match', async () => {
      // Create another scene
      const otherSceneResponse = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/scenes`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Other Scene',
        },
      });
      const otherSceneBody = JSON.parse(otherSceneResponse.body);
      const otherSceneId = otherSceneBody.scene.id;

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${otherSceneId}/tokens/${tokenId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Token not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/tokens/${tokenId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/tokens/${tokenId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid token ID format that might cause database errors
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/tokens/invalid-uuid-format`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });
});
