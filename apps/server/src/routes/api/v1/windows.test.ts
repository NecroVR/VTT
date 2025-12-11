import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { createDb } from '@vtt/database';
import { users, sessions, campaigns, scenes, windows } from '@vtt/database';
import { eq } from 'drizzle-orm';

describe('Windows Routes', () => {
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
    await db.delete(windows);
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
      backgroundColor: '#999999',
      gridType: 'square',
      gridSize: 100,
      padding: 0.25,
      data: {},
    }).returning();

    sceneId = scene.id;
  });

  describe('GET /api/v1/scenes/:sceneId/windows', () => {
    beforeEach(async () => {
      // Create test windows directly in database
      await db.insert(windows).values([
        {
          sceneId,
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 0,
          wallShape: 'straight',
          controlPoints: [],
          opacity: 0.5,
          tint: '#FFFFFF',
          tintIntensity: 0.0,
          snapToGrid: true,
          data: {},
        },
        {
          sceneId,
          x1: 100,
          y1: 0,
          x2: 100,
          y2: 100,
          wallShape: 'curved',
          controlPoints: [{ x: 110, y: 50 }],
          opacity: 0.7,
          tint: '#0000FF',
          tintIntensity: 0.3,
          snapToGrid: false,
          data: { name: 'Stained Glass' },
        },
      ]);
    });

    it('should list all windows for a scene', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/windows`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.windows).toHaveLength(2);
      expect(body.windows[0].sceneId).toBe(sceneId);
      expect(body.windows[1].sceneId).toBe(sceneId);
    });

    it('should return window with all properties', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/windows`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const window = body.windows[0];

      expect(window).toHaveProperty('id');
      expect(window).toHaveProperty('sceneId');
      expect(window).toHaveProperty('x1');
      expect(window).toHaveProperty('y1');
      expect(window).toHaveProperty('x2');
      expect(window).toHaveProperty('y2');
      expect(window).toHaveProperty('wallShape');
      expect(window).toHaveProperty('controlPoints');
      expect(window).toHaveProperty('opacity');
      expect(window).toHaveProperty('tint');
      expect(window).toHaveProperty('tintIntensity');
      expect(window).toHaveProperty('snapToGrid');
      expect(window).toHaveProperty('data');
      expect(window).toHaveProperty('createdAt');
    });

    it('should return window with correct values', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/windows`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const window = body.windows[0];

      expect(window.x1).toBe(0);
      expect(window.y1).toBe(0);
      expect(window.x2).toBe(100);
      expect(window.y2).toBe(0);
      expect(window.wallShape).toBe('straight');
      expect(window.controlPoints).toEqual([]);
      expect(window.opacity).toBe(0.5);
      expect(window.tint).toBe('#FFFFFF');
      expect(window.tintIntensity).toBe(0.0);
      expect(window.snapToGrid).toBe(true);
      expect(window.data).toEqual({});
    });

    it('should return curved window with control points', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/windows`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const curvedWindow = body.windows[1];

      expect(curvedWindow.wallShape).toBe('curved');
      expect(curvedWindow.controlPoints).toEqual([{ x: 110, y: 50 }]);
      expect(curvedWindow.opacity).toBe(0.7);
      expect(curvedWindow.tint).toBe('#0000FF');
      expect(curvedWindow.tintIntensity).toBe(0.3);
      expect(curvedWindow.data).toEqual({ name: 'Stained Glass' });
    });

    it('should return empty array if scene has no windows', async () => {
      await db.delete(windows);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/windows`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.windows).toHaveLength(0);
    });

    it('should return 404 if scene does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/scenes/00000000-0000-0000-0000-000000000000/windows',
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
        url: `/api/v1/scenes/${sceneId}/windows`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/scenes/${sceneId}/windows`,
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
        url: '/api/v1/scenes/invalid-uuid-format/windows',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/v1/windows/:windowId', () => {
    let windowId: string;

    beforeEach(async () => {
      // Create a test window directly in database
      const [window] = await db.insert(windows).values({
        sceneId,
        x1: 50,
        y1: 50,
        x2: 150,
        y2: 150,
        wallShape: 'straight',
        controlPoints: [],
        opacity: 0.6,
        tint: '#FF0000',
        tintIntensity: 0.5,
        snapToGrid: true,
        data: { test: 'value' },
      }).returning();

      windowId = window.id;
    });

    it('should get a window by ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/windows/${windowId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.window.id).toBe(windowId);
      expect(body.window.sceneId).toBe(sceneId);
      expect(body.window.x1).toBe(50);
      expect(body.window.y1).toBe(50);
      expect(body.window.x2).toBe(150);
      expect(body.window.y2).toBe(150);
    });

    it('should return window with all properties', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/windows/${windowId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const window = body.window;

      expect(window.id).toBe(windowId);
      expect(window.sceneId).toBe(sceneId);
      expect(window.wallShape).toBe('straight');
      expect(window.controlPoints).toEqual([]);
      expect(window.opacity).toBe(0.6);
      expect(window.tint).toBe('#FF0000');
      expect(window.tintIntensity).toBe(0.5);
      expect(window.snapToGrid).toBe(true);
      expect(window.data).toEqual({ test: 'value' });
    });

    it('should return 404 if window does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/windows/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Window not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/windows/${windowId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/windows/${windowId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid window ID format that might cause database errors
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/windows/invalid-uuid-format',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/v1/windows', () => {
    it('should create a new window', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/windows',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          sceneId,
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 100,
          wallShape: 'straight',
          controlPoints: [],
          opacity: 0.5,
          tint: '#FFFFFF',
          tintIntensity: 0.0,
          snapToGrid: true,
          data: { custom: 'data' },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.window.sceneId).toBe(sceneId);
      expect(body.window.x1).toBe(0);
      expect(body.window.y1).toBe(0);
      expect(body.window.x2).toBe(100);
      expect(body.window.y2).toBe(100);
      expect(body.window.wallShape).toBe('straight');
      expect(body.window.controlPoints).toEqual([]);
      expect(body.window.opacity).toBe(0.5);
      expect(body.window.tint).toBe('#FFFFFF');
      expect(body.window.tintIntensity).toBe(0.0);
      expect(body.window.snapToGrid).toBe(true);
      expect(body.window.data).toEqual({ custom: 'data' });
    });

    it('should create window with minimal fields and defaults', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/windows',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          sceneId,
          x1: 10,
          y1: 20,
          x2: 30,
          y2: 40,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.window.sceneId).toBe(sceneId);
      expect(body.window.x1).toBe(10);
      expect(body.window.y1).toBe(20);
      expect(body.window.x2).toBe(30);
      expect(body.window.y2).toBe(40);
      expect(body.window.wallShape).toBe('straight');
      expect(body.window.controlPoints).toEqual([]);
      expect(body.window.opacity).toBe(0.5);
      expect(body.window.tint).toBe('#FFFFFF');
      expect(body.window.tintIntensity).toBe(0.0);
      expect(body.window.snapToGrid).toBe(true);
      expect(body.window.data).toEqual({});
    });

    it('should create curved window with control points', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/windows',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          sceneId,
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 0,
          wallShape: 'curved',
          controlPoints: [{ x: 50, y: 25 }],
          opacity: 0.8,
          tint: '#00FF00',
          tintIntensity: 0.4,
          data: { type: 'arch' },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.window.wallShape).toBe('curved');
      expect(body.window.controlPoints).toEqual([{ x: 50, y: 25 }]);
      expect(body.window.opacity).toBe(0.8);
      expect(body.window.tint).toBe('#00FF00');
      expect(body.window.tintIntensity).toBe(0.4);
      expect(body.window.data).toEqual({ type: 'arch' });
    });

    it('should return 400 if sceneId is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/windows',
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

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('sceneId is required');
    });

    it('should return 400 if x1 is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/windows',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          sceneId,
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
        url: '/api/v1/windows',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          sceneId,
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
        url: '/api/v1/windows',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          sceneId,
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
        url: '/api/v1/windows',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          sceneId,
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
        url: '/api/v1/windows',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          sceneId,
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
        url: '/api/v1/windows',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          sceneId: '00000000-0000-0000-0000-000000000000',
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
        url: '/api/v1/windows',
        payload: {
          sceneId,
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
        url: '/api/v1/windows',
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {
          sceneId,
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 100,
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/v1/windows/:windowId', () => {
    let windowId: string;

    beforeEach(async () => {
      // Create a test window directly in database
      const [window] = await db.insert(windows).values({
        sceneId,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        wallShape: 'straight',
        controlPoints: [],
        opacity: 0.5,
        tint: '#FFFFFF',
        tintIntensity: 0.0,
        snapToGrid: true,
        data: { version: 1 },
      }).returning();

      windowId = window.id;
    });

    it('should update window coordinates', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/windows/${windowId}`,
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
      expect(body.window.x1).toBe(50);
      expect(body.window.y1).toBe(50);
      expect(body.window.x2).toBe(150);
      expect(body.window.y2).toBe(150);
    });

    it('should update window properties', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/windows/${windowId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          opacity: 0.8,
          tint: '#0000FF',
          tintIntensity: 0.6,
          snapToGrid: false,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.window.opacity).toBe(0.8);
      expect(body.window.tint).toBe('#0000FF');
      expect(body.window.tintIntensity).toBe(0.6);
      expect(body.window.snapToGrid).toBe(false);
    });

    it('should update wall shape and control points', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/windows/${windowId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          wallShape: 'curved',
          controlPoints: [{ x: 50, y: 25 }],
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.window.wallShape).toBe('curved');
      expect(body.window.controlPoints).toEqual([{ x: 50, y: 25 }]);
    });

    it('should update multiple fields', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/windows/${windowId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x1: 10,
          y1: 20,
          x2: 90,
          y2: 80,
          wallShape: 'curved',
          controlPoints: [{ x: 50, y: 50 }],
          opacity: 0.9,
          tint: '#FF00FF',
          tintIntensity: 0.7,
          snapToGrid: false,
          data: { version: 2, new: 'field' },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.window.x1).toBe(10);
      expect(body.window.y1).toBe(20);
      expect(body.window.x2).toBe(90);
      expect(body.window.y2).toBe(80);
      expect(body.window.wallShape).toBe('curved');
      expect(body.window.controlPoints).toEqual([{ x: 50, y: 50 }]);
      expect(body.window.opacity).toBe(0.9);
      expect(body.window.tint).toBe('#FF00FF');
      expect(body.window.tintIntensity).toBe(0.7);
      expect(body.window.snapToGrid).toBe(false);
      expect(body.window.data).toEqual({ version: 2, new: 'field' });
    });

    it('should return 400 if x1 is not a number', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/windows/${windowId}`,
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
        url: `/api/v1/windows/${windowId}`,
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
        url: `/api/v1/windows/${windowId}`,
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
        url: `/api/v1/windows/${windowId}`,
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

    it('should return 400 if opacity is less than 0', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/windows/${windowId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          opacity: -0.1,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('opacity must be a number between 0 and 1');
    });

    it('should return 400 if opacity is greater than 1', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/windows/${windowId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          opacity: 1.1,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('opacity must be a number between 0 and 1');
    });

    it('should return 400 if tintIntensity is less than 0', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/windows/${windowId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          tintIntensity: -0.1,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('tintIntensity must be a number between 0 and 1');
    });

    it('should return 400 if tintIntensity is greater than 1', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/windows/${windowId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          tintIntensity: 1.1,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('tintIntensity must be a number between 0 and 1');
    });

    it('should return 404 if window does not exist', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/windows/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          x1: 50,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Window not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/windows/${windowId}`,
        payload: {
          x1: 50,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/windows/${windowId}`,
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
      // Use an invalid window ID format that might cause database errors
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/windows/invalid-uuid-format',
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

  describe('DELETE /api/v1/windows/:windowId', () => {
    let windowId: string;

    beforeEach(async () => {
      // Create a test window directly in database
      const [window] = await db.insert(windows).values({
        sceneId,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        wallShape: 'straight',
        controlPoints: [],
        opacity: 0.5,
        tint: '#FFFFFF',
        tintIntensity: 0.0,
        snapToGrid: true,
        data: {},
      }).returning();

      windowId = window.id;
    });

    it('should delete a window', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/windows/${windowId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify window was deleted
      const [deletedWindow] = await db
        .select()
        .from(windows)
        .where(eq(windows.id, windowId))
        .limit(1);

      expect(deletedWindow).toBeUndefined();
    });

    it('should return 404 if window does not exist', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/windows/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Window not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/windows/${windowId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/windows/${windowId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid window ID format that might cause database errors
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/windows/invalid-uuid-format',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });
});
