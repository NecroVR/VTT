import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { createDb } from '@vtt/database';
import { gameSystems } from '@vtt/database';

describe('Game Systems Routes', () => {
  let app: FastifyInstance;
  let db: ReturnType<typeof createDb>;
  let testSystemId: string;

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
    await db.delete(gameSystems);

    // Create test game systems
    const [activeSystem] = await db
      .insert(gameSystems)
      .values({
        systemId: 'test-dnd5e',
        name: 'Test D&D 5e',
        version: '1.0.0',
        publisher: 'Wizards of the Coast',
        description: 'Test game system for D&D 5th Edition',
        type: 'tabletop-rpg',
        isActive: true,
      })
      .returning();

    testSystemId = activeSystem.systemId;

    // Create an inactive system for filtering tests
    await db
      .insert(gameSystems)
      .values({
        systemId: 'test-inactive',
        name: 'Test Inactive System',
        version: '1.0.0',
        publisher: 'Test Publisher',
        description: 'This system is inactive',
        type: 'tabletop-rpg',
        isActive: false,
      });

    // Create another active system
    await db
      .insert(gameSystems)
      .values({
        systemId: 'test-pf2e',
        name: 'Test Pathfinder 2e',
        version: '1.0.0',
        publisher: 'Paizo',
        description: 'Test game system for Pathfinder 2nd Edition',
        type: 'tabletop-rpg',
        isActive: true,
      });
  });

  describe('GET /api/v1/game-systems', () => {
    it('should list all active game systems', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/game-systems',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('gameSystems');
      expect(body.gameSystems).toHaveLength(2); // Only active systems
      expect(body.gameSystems[0]).toHaveProperty('id');
      expect(body.gameSystems[0]).toHaveProperty('systemId');
      expect(body.gameSystems[0]).toHaveProperty('name');
      expect(body.gameSystems[0]).toHaveProperty('version');
      expect(body.gameSystems[0]).toHaveProperty('publisher');
      expect(body.gameSystems[0]).toHaveProperty('description');
      expect(body.gameSystems[0]).toHaveProperty('type');
    });

    it('should not include inactive game systems', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/game-systems',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const inactiveSystem = body.gameSystems.find(
        (s: any) => s.systemId === 'test-inactive'
      );
      expect(inactiveSystem).toBeUndefined();
    });

    it('should return empty array if no active systems exist', async () => {
      // Delete all systems
      await db.delete(gameSystems);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/game-systems',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.gameSystems).toHaveLength(0);
    });

    it('should be publicly accessible without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/game-systems',
      });

      // Should not return 401
      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /api/v1/game-systems/:systemId', () => {
    it('should get a game system by systemId', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/game-systems/${testSystemId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('gameSystem');
      expect(body.gameSystem.systemId).toBe(testSystemId);
      expect(body.gameSystem.name).toBe('Test D&D 5e');
      expect(body.gameSystem.version).toBe('1.0.0');
      expect(body.gameSystem.publisher).toBe('Wizards of the Coast');
      expect(body.gameSystem.type).toBe('tabletop-rpg');
    });

    it('should return 404 for invalid systemId', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/game-systems/invalid-system-id',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Game system not found');
    });

    it('should return 404 for inactive system', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/game-systems/test-inactive',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Game system not found');
    });

    it('should be publicly accessible without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/game-systems/${testSystemId}`,
      });

      // Should not return 401
      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /api/v1/game-systems/:systemId/manifest', () => {
    it('should get manifest for a game system', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/game-systems/${testSystemId}/manifest`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('manifest');
      expect(body.manifest.id).toBe(testSystemId);
      expect(body.manifest.name).toBe('Test D&D 5e');
      expect(body.manifest.version).toBe('1.0.0');
      expect(body.manifest.publisher).toBe('Wizards of the Coast');
      expect(body.manifest.description).toBe('Test game system for D&D 5th Edition');
    });

    it('should return 404 for invalid systemId', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/game-systems/invalid-system-id/manifest',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Game system not found');
    });

    it('should return 404 for inactive system', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/game-systems/test-inactive/manifest',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Game system not found');
    });

    it('should handle system with null description', async () => {
      // Create a system with null description
      await db
        .insert(gameSystems)
        .values({
          systemId: 'test-no-desc',
          name: 'Test System',
          version: '1.0.0',
          publisher: 'Test',
          description: null,
          type: 'tabletop-rpg',
          isActive: true,
        });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/game-systems/test-no-desc/manifest',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.manifest.description).toBe('');
    });

    it('should be publicly accessible without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/game-systems/${testSystemId}/manifest`,
      });

      // Should not return 401
      expect(response.statusCode).toBe(200);
    });
  });
});
