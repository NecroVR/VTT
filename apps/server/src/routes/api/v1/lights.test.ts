import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { createDb } from '@vtt/database';
import { users, sessions, campaigns, scenes, ambientLights } from '@vtt/database';
import { eq } from 'drizzle-orm';

describe('Ambient Lights Routes', () => {
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
    await db.delete(ambientLights);
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

  describe('GET /api/v1/scenes/:sceneId/lights', () => {
    beforeEach(async () => {
      // Create test lights directly in database
      await db.insert(ambientLights).values([
        {
          sceneId,
          x: 500,
          y: 500,
          rotation: 0,
          bright: 20,
          dim: 40,
          angle: 360,
          color: '#ffffff',
          alpha: 0.5,
          animationType: null,
          animationSpeed: 5,
          animationIntensity: 5,
          walls: true,
          vision: false,
          data: { name: 'Torch' },
        },
        {
          sceneId,
          x: 1000,
          y: 1000,
          rotation: 45,
          bright: 30,
          dim: 60,
          angle: 90,
          color: '#ff6600',
          alpha: 0.7,
          animationType: 'pulse',
          animationSpeed: 3,
          animationIntensity: 7,
          walls: false,
          vision: true,
          data: { name: 'Lantern' },
        },
      ]);
    });

    it('should list all lights for a scene', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/lights`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ambientLights).toHaveLength(2);
      expect(body.ambientLights[0].sceneId).toBe(sceneId);
      expect(body.ambientLights[1].sceneId).toBe(sceneId);
    });

    it('should return light with all properties', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/lights`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const light = body.ambientLights[0];

      expect(light).toHaveProperty('id');
      expect(light).toHaveProperty('sceneId');
      expect(light).toHaveProperty('x');
      expect(light).toHaveProperty('y');
      expect(light).toHaveProperty('rotation');
      expect(light).toHaveProperty('bright');
      expect(light).toHaveProperty('dim');
      expect(light).toHaveProperty('angle');
      expect(light).toHaveProperty('color');
      expect(light).toHaveProperty('alpha');
      expect(light).toHaveProperty('animationType');
      expect(light).toHaveProperty('animationSpeed');
      expect(light).toHaveProperty('animationIntensity');
      expect(light).toHaveProperty('walls');
      expect(light).toHaveProperty('vision');
      expect(light).toHaveProperty('data');
      expect(light).toHaveProperty('createdAt');
    });

    it('should return light with correct values', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/lights`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const light = body.ambientLights[0];

      expect(light.x).toBe(500);
      expect(light.y).toBe(500);
      expect(light.rotation).toBe(0);
      expect(light.bright).toBe(20);
      expect(light.dim).toBe(40);
      expect(light.angle).toBe(360);
      expect(light.color).toBe('#ffffff');
      expect(light.alpha).toBe(0.5);
      expect(light.animationType).toBe(null);
      expect(light.animationSpeed).toBe(5);
      expect(light.animationIntensity).toBe(5);
      expect(light.walls).toBe(true);
      expect(light.vision).toBe(false);
      expect(light.data).toEqual({ name: 'Torch' });
    });

    it('should return empty array if scene has no lights', async () => {
      await db.delete(ambientLights);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/lights`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ambientLights).toHaveLength(0);
    });

    it('should return 404 if scene does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/scenes/00000000-0000-0000-0000-000000000000/lights',
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
        url: `/api/v1/scenes/${sceneId}/lights`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/lights`,
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
        url: '/api/v1/scenes/invalid-uuid-format/lights',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/v1/lights/:lightId', () => {
    let lightId: string;

    beforeEach(async () => {
      // Create a test light directly in database
      const [light] = await db.insert(ambientLights).values({
        sceneId,
        x: 750,
        y: 750,
        rotation: 30,
        bright: 25,
        dim: 50,
        angle: 180,
        color: '#00ff00',
        alpha: 0.6,
        animationType: 'flicker',
        animationSpeed: 4,
        animationIntensity: 6,
        walls: true,
        vision: true,
        data: { source: 'candle' },
      }).returning();

      lightId = light.id;
    });

    it('should get a light by ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/lights/${lightId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ambientLight.id).toBe(lightId);
      expect(body.ambientLight.sceneId).toBe(sceneId);
      expect(body.ambientLight.x).toBe(750);
      expect(body.ambientLight.y).toBe(750);
    });

    it('should return light with all properties', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/lights/${lightId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const light = body.ambientLight;

      expect(light.id).toBe(lightId);
      expect(light.sceneId).toBe(sceneId);
      expect(light.x).toBe(750);
      expect(light.y).toBe(750);
      expect(light.rotation).toBe(30);
      expect(light.bright).toBe(25);
      expect(light.dim).toBe(50);
      expect(light.angle).toBe(180);
      expect(light.color).toBe('#00ff00');
      expect(light.alpha).toBe(0.6);
      expect(light.animationType).toBe('flicker');
      expect(light.animationSpeed).toBe(4);
      expect(light.animationIntensity).toBe(6);
      expect(light.walls).toBe(true);
      expect(light.vision).toBe(true);
      expect(light.data).toEqual({ source: 'candle' });
    });

    it('should return 404 if light does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lights/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Light not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/lights/${lightId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/lights/${lightId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid light ID format that might cause database errors
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lights/invalid-uuid-format',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/v1/scenes/:sceneId/lights', () => {
    it('should create a new light', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/lights`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 200,
          y: 300,
          rotation: 45,
          bright: 15,
          dim: 30,
          angle: 90,
          color: '#0000ff',
          alpha: 0.8,
          animationType: 'wave',
          animationSpeed: 2,
          animationIntensity: 4,
          walls: false,
          vision: true,
          data: { type: 'magical' },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.ambientLight.sceneId).toBe(sceneId);
      expect(body.ambientLight.x).toBe(200);
      expect(body.ambientLight.y).toBe(300);
      expect(body.ambientLight.rotation).toBe(45);
      expect(body.ambientLight.bright).toBe(15);
      expect(body.ambientLight.dim).toBe(30);
      expect(body.ambientLight.angle).toBe(90);
      expect(body.ambientLight.color).toBe('#0000ff');
      expect(body.ambientLight.alpha).toBe(0.8);
      expect(body.ambientLight.animationType).toBe('wave');
      expect(body.ambientLight.animationSpeed).toBe(2);
      expect(body.ambientLight.animationIntensity).toBe(4);
      expect(body.ambientLight.walls).toBe(false);
      expect(body.ambientLight.vision).toBe(true);
      expect(body.ambientLight.data).toEqual({ type: 'magical' });
    });

    it('should create light with minimal fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/lights`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 100,
          y: 100,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.ambientLight.sceneId).toBe(sceneId);
      expect(body.ambientLight.x).toBe(100);
      expect(body.ambientLight.y).toBe(100);
      expect(body.ambientLight.rotation).toBe(0);
      expect(body.ambientLight.bright).toBe(20);
      expect(body.ambientLight.dim).toBe(40);
      expect(body.ambientLight.angle).toBe(360);
      expect(body.ambientLight.color).toBe('#ffffff');
      expect(body.ambientLight.alpha).toBe(0.5);
      expect(body.ambientLight.animationType).toBe(null);
      expect(body.ambientLight.animationSpeed).toBe(5);
      expect(body.ambientLight.animationIntensity).toBe(5);
      expect(body.ambientLight.walls).toBe(true);
      expect(body.ambientLight.vision).toBe(false);
      expect(body.ambientLight.data).toEqual({});
    });

    it('should return 400 if x is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/lights`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          y: 100,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Light x position is required');
    });

    it('should return 400 if y is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/lights`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 100,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Light y position is required');
    });

    it('should accept x and y as zero', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/lights`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 0,
          y: 0,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.ambientLight.x).toBe(0);
      expect(body.ambientLight.y).toBe(0);
    });

    it('should return 404 if scene does not exist', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/scenes/00000000-0000-0000-0000-000000000000/lights',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 100,
          y: 100,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Scene not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/lights`,
        payload: {
          x: 100,
          y: 100,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/scenes/${sceneId}/lights`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {
          x: 100,
          y: 100,
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/v1/lights/:lightId', () => {
    let lightId: string;

    beforeEach(async () => {
      // Create a test light directly in database
      const [light] = await db.insert(ambientLights).values({
        sceneId,
        x: 400,
        y: 400,
        rotation: 0,
        bright: 20,
        dim: 40,
        angle: 360,
        color: '#ffffff',
        alpha: 0.5,
        animationType: null,
        animationSpeed: 5,
        animationIntensity: 5,
        walls: true,
        vision: false,
        data: { original: 'value' },
      }).returning();

      lightId = light.id;
    });

    it('should update light position', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/lights/${lightId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 600,
          y: 700,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ambientLight.x).toBe(600);
      expect(body.ambientLight.y).toBe(700);
      expect(body.ambientLight.rotation).toBe(0);
    });

    it('should update light properties', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/lights/${lightId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          bright: 35,
          dim: 70,
          color: '#ff0000',
          alpha: 0.9,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ambientLight.bright).toBe(35);
      expect(body.ambientLight.dim).toBe(70);
      expect(body.ambientLight.color).toBe('#ff0000');
      expect(body.ambientLight.alpha).toBe(0.9);
    });

    it('should update light animation', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/lights/${lightId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          animationType: 'pulse',
          animationSpeed: 8,
          animationIntensity: 9,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ambientLight.animationType).toBe('pulse');
      expect(body.ambientLight.animationSpeed).toBe(8);
      expect(body.ambientLight.animationIntensity).toBe(9);
    });

    it('should update multiple fields', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/lights/${lightId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 800,
          y: 900,
          rotation: 90,
          bright: 40,
          dim: 80,
          angle: 120,
          color: '#00ffff',
          alpha: 0.7,
          walls: false,
          vision: true,
          data: { updated: 'data', more: 'fields' },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ambientLight.x).toBe(800);
      expect(body.ambientLight.y).toBe(900);
      expect(body.ambientLight.rotation).toBe(90);
      expect(body.ambientLight.bright).toBe(40);
      expect(body.ambientLight.dim).toBe(80);
      expect(body.ambientLight.angle).toBe(120);
      expect(body.ambientLight.color).toBe('#00ffff');
      expect(body.ambientLight.alpha).toBe(0.7);
      expect(body.ambientLight.walls).toBe(false);
      expect(body.ambientLight.vision).toBe(true);
      expect(body.ambientLight.data).toEqual({ updated: 'data', more: 'fields' });
    });

    it('should clear animation type with null', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/lights/${lightId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          animationType: null,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ambientLight.animationType).toBe(null);
    });

    it('should return 404 if light does not exist', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/lights/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 100,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Light not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/lights/${lightId}`,
        payload: {
          x: 100,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/lights/${lightId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {
          x: 100,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid light ID format that might cause database errors
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/lights/invalid-uuid-format',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x: 100,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('DELETE /api/v1/lights/:lightId', () => {
    let lightId: string;

    beforeEach(async () => {
      // Create a test light directly in database
      const [light] = await db.insert(ambientLights).values({
        sceneId,
        x: 300,
        y: 300,
        rotation: 0,
        bright: 20,
        dim: 40,
        angle: 360,
        color: '#ffffff',
        alpha: 0.5,
        animationType: null,
        animationSpeed: 5,
        animationIntensity: 5,
        walls: true,
        vision: false,
        data: {},
      }).returning();

      lightId = light.id;
    });

    it('should delete a light', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/lights/${lightId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify light was deleted
      const [deletedLight] = await db
        .select()
        .from(ambientLights)
        .where(eq(ambientLights.id, lightId))
        .limit(1);

      expect(deletedLight).toBeUndefined();
    });

    it('should return 404 if light does not exist', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/lights/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Light not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/lights/${lightId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/lights/${lightId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid light ID format that might cause database errors
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/lights/invalid-uuid-format',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });
});
