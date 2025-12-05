import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { createDb } from '@vtt/database';
import { users, sessions, campaigns, actors } from '@vtt/database';
import { eq } from 'drizzle-orm';

describe('Actors Routes', () => {
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
    await db.delete(actors);
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

  describe('GET /api/v1/campaigns/:campaignId/actors', () => {
    beforeEach(async () => {
      // Create test actors directly in database
      await db.insert(actors).values([
        {
          campaignId,
          name: 'Fighter Character',
          actorType: 'character',
          img: '/images/fighter.png',
          ownerId: userId,
          attributes: { str: 18, dex: 14, con: 16, int: 10, wis: 12, cha: 8 },
          abilities: { attack: 5, defense: 3 },
          sort: 0,
          data: { level: 5, class: 'Fighter' },
        },
        {
          campaignId,
          name: 'Goblin Enemy',
          actorType: 'npc',
          img: '/images/goblin.png',
          attributes: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
          abilities: {},
          sort: 1,
          data: { cr: 0.25 },
        },
      ]);
    });

    it('should list all actors for a campaign', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}/actors`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.actors).toHaveLength(2);
      expect(body.actors[0].name).toBe('Fighter Character');
      expect(body.actors[1].name).toBe('Goblin Enemy');
      expect(body.actors[0].campaignId).toBe(campaignId);
      expect(body.actors[1].campaignId).toBe(campaignId);
    });

    it('should return actor with all properties', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}/actors`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const actor = body.actors[0];

      expect(actor).toHaveProperty('id');
      expect(actor).toHaveProperty('campaignId');
      expect(actor).toHaveProperty('name');
      expect(actor).toHaveProperty('actorType');
      expect(actor).toHaveProperty('img');
      expect(actor).toHaveProperty('ownerId');
      expect(actor).toHaveProperty('attributes');
      expect(actor).toHaveProperty('abilities');
      expect(actor).toHaveProperty('folderId');
      expect(actor).toHaveProperty('sort');
      expect(actor).toHaveProperty('data');
      expect(actor).toHaveProperty('createdAt');
      expect(actor).toHaveProperty('updatedAt');
    });

    it('should return actor with correct values', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}/actors`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const actor = body.actors[0];

      expect(actor.name).toBe('Fighter Character');
      expect(actor.actorType).toBe('character');
      expect(actor.img).toBe('/images/fighter.png');
      expect(actor.ownerId).toBe(userId);
      expect(actor.attributes).toEqual({ str: 18, dex: 14, con: 16, int: 10, wis: 12, cha: 8 });
      expect(actor.abilities).toEqual({ attack: 5, defense: 3 });
      expect(actor.sort).toBe(0);
      expect(actor.data).toEqual({ level: 5, class: 'Fighter' });
    });

    it('should return empty array if campaign has no actors', async () => {
      await db.delete(actors);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}/actors`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.actors).toHaveLength(0);
    });

    it('should return 404 if campaign does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/campaigns/00000000-0000-0000-0000-000000000000/actors',
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
        url: `/api/v1/campaigns/${campaignId}/actors`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}/actors`,
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
        url: '/api/v1/campaigns/invalid-uuid-format/actors',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/v1/actors/:actorId', () => {
    let actorId: string;

    beforeEach(async () => {
      // Create a test actor directly in database
      const [actor] = await db.insert(actors).values({
        campaignId,
        name: 'Test Actor',
        actorType: 'character',
        img: '/images/test.png',
        ownerId: userId,
        attributes: { str: 10, dex: 10, con: 10 },
        abilities: { skill: 'value' },
        sort: 0,
        data: { custom: 'data' },
      }).returning();

      actorId = actor.id;
    });

    it('should get an actor by ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/actors/${actorId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.actor.id).toBe(actorId);
      expect(body.actor.name).toBe('Test Actor');
      expect(body.actor.campaignId).toBe(campaignId);
      expect(body.actor.actorType).toBe('character');
    });

    it('should return actor with all properties', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/actors/${actorId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const actor = body.actor;

      expect(actor.id).toBe(actorId);
      expect(actor.campaignId).toBe(campaignId);
      expect(actor.name).toBe('Test Actor');
      expect(actor.attributes).toEqual({ str: 10, dex: 10, con: 10 });
      expect(actor.abilities).toEqual({ skill: 'value' });
      expect(actor.data).toEqual({ custom: 'data' });
      expect(actor.img).toBe('/images/test.png');
      expect(actor.ownerId).toBe(userId);
    });

    it('should return 404 if actor does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/actors/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Actor not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/actors/${actorId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/actors/${actorId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid actor ID format that might cause database errors
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/actors/invalid-uuid-format',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/v1/campaigns/:campaignId/actors', () => {
    it('should create a new actor', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/actors`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'New Character',
          actorType: 'character',
          img: '/images/character.png',
          attributes: { str: 16, dex: 14 },
          abilities: { attack: 3 },
          data: { level: 1 },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.actor.name).toBe('New Character');
      expect(body.actor.actorType).toBe('character');
      expect(body.actor.campaignId).toBe(campaignId);
      expect(body.actor.img).toBe('/images/character.png');
      expect(body.actor.attributes).toEqual({ str: 16, dex: 14 });
      expect(body.actor.abilities).toEqual({ attack: 3 });
      expect(body.actor.data).toEqual({ level: 1 });
    });

    it('should create actor with minimal fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/actors`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Simple Actor',
          actorType: 'npc',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.actor.name).toBe('Simple Actor');
      expect(body.actor.actorType).toBe('npc');
      expect(body.actor.campaignId).toBe(campaignId);
      expect(body.actor.attributes).toEqual({});
      expect(body.actor.abilities).toEqual({});
      expect(body.actor.data).toEqual({});
      expect(body.actor.sort).toBe(0);
    });

    it('should return 400 if name is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/actors`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          actorType: 'character',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Actor name is required');
    });

    it('should return 400 if name is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/actors`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: '   ',
          actorType: 'character',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Actor name is required');
    });

    it('should return 400 if actorType is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/actors`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Test Actor',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Actor type is required');
    });

    it('should return 400 if actorType is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/actors`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Test Actor',
          actorType: '   ',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Actor type is required');
    });

    it('should return 404 if campaign does not exist', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns/00000000-0000-0000-0000-000000000000/actors',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Test Actor',
          actorType: 'character',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Campaign not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/actors`,
        payload: {
          name: 'Test Actor',
          actorType: 'character',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/actors`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {
          name: 'Test Actor',
          actorType: 'character',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/v1/actors/:actorId', () => {
    let actorId: string;

    beforeEach(async () => {
      // Create a test actor directly in database
      const [actor] = await db.insert(actors).values({
        campaignId,
        name: 'Original Actor',
        actorType: 'character',
        img: '/images/original.png',
        ownerId: userId,
        attributes: { str: 10 },
        abilities: { skill: 'old' },
        sort: 0,
        data: { version: 1 },
      }).returning();

      actorId = actor.id;
    });

    it('should update actor name', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/actors/${actorId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Updated Actor',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.actor.name).toBe('Updated Actor');
      expect(body.actor.actorType).toBe('character');
    });

    it('should update actor attributes', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/actors/${actorId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          attributes: { str: 18, dex: 14 },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.actor.attributes).toEqual({ str: 18, dex: 14 });
    });

    it('should update multiple fields', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/actors/${actorId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Multi Update',
          actorType: 'npc',
          img: '/images/new.png',
          sort: 5,
          data: { version: 2, new: 'field' },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.actor.name).toBe('Multi Update');
      expect(body.actor.actorType).toBe('npc');
      expect(body.actor.img).toBe('/images/new.png');
      expect(body.actor.sort).toBe(5);
      expect(body.actor.data).toEqual({ version: 2, new: 'field' });
    });

    it('should return 400 if name is empty', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/actors/${actorId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: '   ',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Actor name cannot be empty');
    });

    it('should return 400 if actorType is empty', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/actors/${actorId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          actorType: '   ',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Actor type cannot be empty');
    });

    it('should return 404 if actor does not exist', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/actors/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Actor not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/actors/${actorId}`,
        payload: {
          name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/actors/${actorId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {
          name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid actor ID format that might cause database errors
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/actors/invalid-uuid-format',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Updated Name',
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('DELETE /api/v1/actors/:actorId', () => {
    let actorId: string;

    beforeEach(async () => {
      // Create a test actor directly in database
      const [actor] = await db.insert(actors).values({
        campaignId,
        name: 'Actor to Delete',
        actorType: 'character',
        attributes: {},
        abilities: {},
        sort: 0,
        data: {},
      }).returning();

      actorId = actor.id;
    });

    it('should delete an actor', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/actors/${actorId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify actor was deleted
      const [deletedActor] = await db
        .select()
        .from(actors)
        .where(eq(actors.id, actorId))
        .limit(1);

      expect(deletedActor).toBeUndefined();
    });

    it('should return 404 if actor does not exist', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/actors/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Actor not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/actors/${actorId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/actors/${actorId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid actor ID format that might cause database errors
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/actors/invalid-uuid-format',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });
});
