import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { createDb } from '@vtt/database';
import { users, sessions, games, combats, combatants, actors } from '@vtt/database';
import { eq } from 'drizzle-orm';

describe('Combats Routes', () => {
  let app: FastifyInstance;
  let db: ReturnType<typeof createDb>;
  let sessionId: string;
  let userId: string;
  let gameId: string;

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
    await db.delete(combatants);
    await db.delete(combats);
    await db.delete(actors);
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
  });

  // ==================== COMBAT ROUTES ====================

  describe('GET /api/v1/games/:gameId/combats', () => {
    beforeEach(async () => {
      // Create test combats directly in database
      await db.insert(combats).values([
        {
          gameId,
          sceneId: null,
          active: true,
          round: 3,
          turn: 1,
          sort: 0,
          data: { difficulty: 'medium' },
        },
        {
          gameId,
          sceneId: null,
          active: false,
          round: 0,
          turn: 0,
          sort: 1,
          data: { status: 'finished' },
        },
      ]);
    });

    it('should list all combats for a game', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/games/${gameId}/combats`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.combats).toHaveLength(2);
      expect(body.combats[0].gameId).toBe(gameId);
      expect(body.combats[1].gameId).toBe(gameId);
    });

    it('should return combat with all properties', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/games/${gameId}/combats`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const combat = body.combats[0];

      expect(combat).toHaveProperty('id');
      expect(combat).toHaveProperty('gameId');
      expect(combat).toHaveProperty('sceneId');
      expect(combat).toHaveProperty('active');
      expect(combat).toHaveProperty('round');
      expect(combat).toHaveProperty('turn');
      expect(combat).toHaveProperty('sort');
      expect(combat).toHaveProperty('data');
      expect(combat).toHaveProperty('createdAt');
      expect(combat).toHaveProperty('updatedAt');
    });

    it('should return combat with correct values', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/games/${gameId}/combats`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const combat = body.combats[0];

      expect(combat.gameId).toBe(gameId);
      expect(combat.active).toBe(true);
      expect(combat.round).toBe(3);
      expect(combat.turn).toBe(1);
      expect(combat.sort).toBe(0);
      expect(combat.data).toEqual({ difficulty: 'medium' });
    });

    it('should return empty array if game has no combats', async () => {
      await db.delete(combats);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/games/${gameId}/combats`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.combats).toHaveLength(0);
    });

    it('should return 404 if game does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/games/00000000-0000-0000-0000-000000000000/combats',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Game not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/games/${gameId}/combats`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/games/${gameId}/combats`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid game ID format that might cause database errors
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/games/invalid-uuid-format/combats',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/v1/combats/:combatId', () => {
    let combatId: string;
    let actorId: string;

    beforeEach(async () => {
      // Create a test actor
      const [actor] = await db.insert(actors).values({
        gameId,
        name: 'Fighter',
        actorType: 'character',
        attributes: { hp: 50 },
        abilities: {},
        sort: 0,
        data: {},
      }).returning();

      actorId = actor.id;

      // Create a test combat
      const [combat] = await db.insert(combats).values({
        gameId,
        sceneId: null,
        active: true,
        round: 2,
        turn: 0,
        sort: 0,
        data: {},
      }).returning();

      combatId = combat.id;

      // Create test combatants
      await db.insert(combatants).values([
        {
          combatId,
          actorId,
          tokenId: null,
          initiative: 18,
          initiativeModifier: 2,
          hidden: false,
          defeated: false,
          data: {},
        },
        {
          combatId,
          actorId: null,
          tokenId: null,
          initiative: 12,
          initiativeModifier: 0,
          hidden: false,
          defeated: false,
          data: { name: 'Goblin' },
        },
      ]);
    });

    it('should get a combat by ID with combatants', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/combats/${combatId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.combat.id).toBe(combatId);
      expect(body.combat.gameId).toBe(gameId);
      expect(body.combat.active).toBe(true);
      expect(body.combat.round).toBe(2);
      expect(body.combatants).toHaveLength(2);
    });

    it('should return combat with all properties', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/combats/${combatId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const combat = body.combat;

      expect(combat.id).toBe(combatId);
      expect(combat.gameId).toBe(gameId);
      expect(combat.active).toBe(true);
      expect(combat.round).toBe(2);
      expect(combat.turn).toBe(0);
      expect(combat.sort).toBe(0);
    });

    it('should return combatants with all properties', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/combats/${combatId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const combatant = body.combatants[0];

      expect(combatant).toHaveProperty('id');
      expect(combatant).toHaveProperty('combatId');
      expect(combatant).toHaveProperty('actorId');
      expect(combatant).toHaveProperty('tokenId');
      expect(combatant).toHaveProperty('initiative');
      expect(combatant).toHaveProperty('initiativeModifier');
      expect(combatant).toHaveProperty('hidden');
      expect(combatant).toHaveProperty('defeated');
      expect(combatant).toHaveProperty('data');
      expect(combatant).toHaveProperty('createdAt');
    });

    it('should return 404 if combat does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/combats/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Combat not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/combats/${combatId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/combats/${combatId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid combat ID format that might cause database errors
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/combats/invalid-uuid-format',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/v1/games/:gameId/combats', () => {
    it('should create a new combat', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/games/${gameId}/combats`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          sceneId: null,
          active: true,
          round: 1,
          turn: 0,
          sort: 0,
          data: { encounter: 'goblin-ambush' },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.combat.gameId).toBe(gameId);
      expect(body.combat.active).toBe(true);
      expect(body.combat.round).toBe(1);
      expect(body.combat.turn).toBe(0);
      expect(body.combat.data).toEqual({ encounter: 'goblin-ambush' });
    });

    it('should create combat with minimal fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/games/${gameId}/combats`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {},
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.combat.gameId).toBe(gameId);
      expect(body.combat.active).toBe(false);
      expect(body.combat.round).toBe(0);
      expect(body.combat.turn).toBe(0);
      expect(body.combat.sort).toBe(0);
      expect(body.combat.data).toEqual({});
    });

    it('should return 404 if game does not exist', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/games/00000000-0000-0000-0000-000000000000/combats',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {},
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Game not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/games/${gameId}/combats`,
        payload: {},
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/games/${gameId}/combats`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {},
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/v1/combats/:combatId', () => {
    let combatId: string;

    beforeEach(async () => {
      // Create a test combat
      const [combat] = await db.insert(combats).values({
        gameId,
        sceneId: null,
        active: false,
        round: 1,
        turn: 0,
        sort: 0,
        data: { status: 'preparing' },
      }).returning();

      combatId = combat.id;
    });

    it('should update combat active status', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/combats/${combatId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          active: true,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.combat.active).toBe(true);
      expect(body.combat.round).toBe(1);
    });

    it('should update combat round and turn', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/combats/${combatId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          round: 3,
          turn: 2,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.combat.round).toBe(3);
      expect(body.combat.turn).toBe(2);
    });

    it('should update multiple fields', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/combats/${combatId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          active: true,
          round: 5,
          turn: 1,
          sort: 10,
          data: { status: 'active', difficulty: 'hard' },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.combat.active).toBe(true);
      expect(body.combat.round).toBe(5);
      expect(body.combat.turn).toBe(1);
      expect(body.combat.sort).toBe(10);
      expect(body.combat.data).toEqual({ status: 'active', difficulty: 'hard' });
    });

    it('should return 404 if combat does not exist', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/combats/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          active: true,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Combat not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/combats/${combatId}`,
        payload: {
          active: true,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/combats/${combatId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {
          active: true,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid combat ID format that might cause database errors
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/combats/invalid-uuid-format',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          active: true,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('DELETE /api/v1/combats/:combatId', () => {
    let combatId: string;

    beforeEach(async () => {
      // Create a test combat
      const [combat] = await db.insert(combats).values({
        gameId,
        sceneId: null,
        active: false,
        round: 0,
        turn: 0,
        sort: 0,
        data: {},
      }).returning();

      combatId = combat.id;
    });

    it('should delete a combat', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/combats/${combatId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify combat was deleted
      const [deletedCombat] = await db
        .select()
        .from(combats)
        .where(eq(combats.id, combatId))
        .limit(1);

      expect(deletedCombat).toBeUndefined();
    });

    it('should cascade delete combatants when combat is deleted', async () => {
      // Create a combatant for the combat
      await db.insert(combatants).values({
        combatId,
        actorId: null,
        tokenId: null,
        initiative: 10,
        initiativeModifier: 0,
        hidden: false,
        defeated: false,
        data: {},
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/combats/${combatId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify combatants were cascade deleted
      const remainingCombatants = await db
        .select()
        .from(combatants)
        .where(eq(combatants.combatId, combatId));

      expect(remainingCombatants).toHaveLength(0);
    });

    it('should return 404 if combat does not exist', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/combats/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Combat not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/combats/${combatId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/combats/${combatId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid combat ID format that might cause database errors
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/combats/invalid-uuid-format',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  // ==================== COMBATANT ROUTES ====================

  describe('POST /api/v1/combats/:combatId/combatants', () => {
    let combatId: string;
    let actorId: string;

    beforeEach(async () => {
      // Create a test combat
      const [combat] = await db.insert(combats).values({
        gameId,
        sceneId: null,
        active: false,
        round: 0,
        turn: 0,
        sort: 0,
        data: {},
      }).returning();

      combatId = combat.id;

      // Create a test actor
      const [actor] = await db.insert(actors).values({
        gameId,
        name: 'Wizard',
        actorType: 'character',
        attributes: { hp: 30 },
        abilities: {},
        sort: 0,
        data: {},
      }).returning();

      actorId = actor.id;
    });

    it('should create a new combatant with actorId', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/combats/${combatId}/combatants`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          actorId,
          initiative: 15,
          initiativeModifier: 3,
          hidden: false,
          defeated: false,
          data: { temp_hp: 5 },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.combatant.combatId).toBe(combatId);
      expect(body.combatant.actorId).toBe(actorId);
      expect(body.combatant.initiative).toBe(15);
      expect(body.combatant.initiativeModifier).toBe(3);
      expect(body.combatant.data).toEqual({ temp_hp: 5 });
    });

    it('should create combatant with minimal fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/combats/${combatId}/combatants`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          actorId,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.combatant.combatId).toBe(combatId);
      expect(body.combatant.actorId).toBe(actorId);
      expect(body.combatant.initiative).toBeNull();
      expect(body.combatant.initiativeModifier).toBe(0);
      expect(body.combatant.hidden).toBe(false);
      expect(body.combatant.defeated).toBe(false);
      expect(body.combatant.data).toEqual({});
    });

    it('should return 400 if neither actorId nor tokenId is provided', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/combats/${combatId}/combatants`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          initiative: 10,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Either actorId or tokenId must be provided');
    });

    it('should return 404 if combat does not exist', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/combats/00000000-0000-0000-0000-000000000000/combatants',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          actorId,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Combat not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/combats/${combatId}/combatants`,
        payload: {
          actorId,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/combats/${combatId}/combatants`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {
          actorId,
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/v1/combatants/:combatantId', () => {
    let combatId: string;
    let combatantId: string;

    beforeEach(async () => {
      // Create a test combat
      const [combat] = await db.insert(combats).values({
        gameId,
        sceneId: null,
        active: false,
        round: 0,
        turn: 0,
        sort: 0,
        data: {},
      }).returning();

      combatId = combat.id;

      // Create a test combatant
      const [combatant] = await db.insert(combatants).values({
        combatId,
        actorId: null,
        tokenId: null,
        initiative: 10,
        initiativeModifier: 0,
        hidden: false,
        defeated: false,
        data: { hp: 20 },
      }).returning();

      combatantId = combatant.id;
    });

    it('should update combatant initiative', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/combatants/${combatantId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          initiative: 18,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.combatant.initiative).toBe(18);
      expect(body.combatant.initiativeModifier).toBe(0);
    });

    it('should update combatant defeated status', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/combatants/${combatantId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          defeated: true,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.combatant.defeated).toBe(true);
    });

    it('should update multiple fields', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/combatants/${combatantId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          initiative: 22,
          initiativeModifier: 5,
          hidden: true,
          defeated: false,
          data: { hp: 15, temp_hp: 10 },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.combatant.initiative).toBe(22);
      expect(body.combatant.initiativeModifier).toBe(5);
      expect(body.combatant.hidden).toBe(true);
      expect(body.combatant.defeated).toBe(false);
      expect(body.combatant.data).toEqual({ hp: 15, temp_hp: 10 });
    });

    it('should return 404 if combatant does not exist', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/combatants/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          initiative: 15,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Combatant not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/combatants/${combatantId}`,
        payload: {
          initiative: 15,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/combatants/${combatantId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {
          initiative: 15,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid combatant ID format that might cause database errors
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/combatants/invalid-uuid-format',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          initiative: 15,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('DELETE /api/v1/combatants/:combatantId', () => {
    let combatId: string;
    let combatantId: string;

    beforeEach(async () => {
      // Create a test combat
      const [combat] = await db.insert(combats).values({
        gameId,
        sceneId: null,
        active: false,
        round: 0,
        turn: 0,
        sort: 0,
        data: {},
      }).returning();

      combatId = combat.id;

      // Create a test combatant
      const [combatant] = await db.insert(combatants).values({
        combatId,
        actorId: null,
        tokenId: null,
        initiative: 10,
        initiativeModifier: 0,
        hidden: false,
        defeated: false,
        data: {},
      }).returning();

      combatantId = combatant.id;
    });

    it('should delete a combatant', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/combatants/${combatantId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify combatant was deleted
      const [deletedCombatant] = await db
        .select()
        .from(combatants)
        .where(eq(combatants.id, combatantId))
        .limit(1);

      expect(deletedCombatant).toBeUndefined();
    });

    it('should return 404 if combatant does not exist', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/combatants/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Combatant not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/combatants/${combatantId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/combatants/${combatantId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid combatant ID format that might cause database errors
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/combatants/invalid-uuid-format',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });
});
