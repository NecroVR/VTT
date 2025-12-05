import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';

describe('API v1 Index Route', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({
      NODE_ENV: 'test',
      PORT: 3001,
      HOST: '0.0.0.0',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://claude:Claude^YV18@localhost:5432/vtt',
      REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
      CORS_ORIGIN: '*',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1', () => {
    it('should return API version information', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.version).toBe('v1');
      expect(body.message).toBe('VTT API v1');
    });

    it('should return available endpoints', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.endpoints).toBeDefined();
      expect(body.endpoints.health).toBe('/health');
      expect(body.endpoints.websocket).toBe('/ws');
      expect(body.endpoints.users).toBe('/api/v1/users');
      expect(body.endpoints.auth).toBe('/api/v1/auth');
      expect(body.endpoints.campaigns).toBe('/api/v1/campaigns');
      expect(body.endpoints.scenes).toBe('/api/v1/scenes');
    });

    it('should return all endpoint properties', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body).toHaveProperty('version');
      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('endpoints');
      expect(body.endpoints).toHaveProperty('health');
      expect(body.endpoints).toHaveProperty('websocket');
      expect(body.endpoints).toHaveProperty('users');
      expect(body.endpoints).toHaveProperty('auth');
      expect(body.endpoints).toHaveProperty('campaigns');
      expect(body.endpoints).toHaveProperty('scenes');
    });
  });
});
