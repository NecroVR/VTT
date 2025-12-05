import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { createDb } from '@vtt/database';
import { users, sessions, campaigns, actors, items } from '@vtt/database';
import { eq } from 'drizzle-orm';

describe('Items Routes', () => {
  let app: FastifyInstance;
  let db: ReturnType<typeof createDb>;
  let sessionId: string;
  let userId: string;
  let campaignId: string;
  let actorId: string;

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
    await db.delete(items);
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

    // Create a test actor
    const [actor] = await db.insert(actors).values({
      campaignId,
      name: 'Test Actor',
      actorType: 'character',
      attributes: {},
      abilities: {},
      sort: 0,
      data: {},
    }).returning();

    actorId = actor.id;
  });

  describe('GET /api/v1/actors/:actorId/items', () => {
    beforeEach(async () => {
      // Create test items directly in database
      await db.insert(items).values([
        {
          campaignId,
          actorId,
          name: 'Longsword',
          itemType: 'weapon',
          img: '/images/longsword.png',
          description: 'A sharp longsword',
          quantity: 1,
          weight: 3,
          price: 15,
          equipped: true,
          sort: 0,
          data: { damage: '1d8', damageType: 'slashing' },
        },
        {
          campaignId,
          actorId,
          name: 'Health Potion',
          itemType: 'consumable',
          img: '/images/potion.png',
          description: 'Restores 2d4+2 HP',
          quantity: 3,
          weight: 0.5,
          price: 50,
          equipped: false,
          sort: 1,
          data: { healing: '2d4+2' },
        },
      ]);
    });

    it('should list all items for an actor', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/actors/${actorId}/items`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.items).toHaveLength(2);
      expect(body.items[0].name).toBe('Longsword');
      expect(body.items[1].name).toBe('Health Potion');
      expect(body.items[0].actorId).toBe(actorId);
      expect(body.items[1].actorId).toBe(actorId);
    });

    it('should return item with all properties', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/actors/${actorId}/items`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const item = body.items[0];

      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('campaignId');
      expect(item).toHaveProperty('actorId');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('itemType');
      expect(item).toHaveProperty('img');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('quantity');
      expect(item).toHaveProperty('weight');
      expect(item).toHaveProperty('price');
      expect(item).toHaveProperty('equipped');
      expect(item).toHaveProperty('data');
      expect(item).toHaveProperty('sort');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
    });

    it('should return item with correct values', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/actors/${actorId}/items`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const item = body.items[0];

      expect(item.name).toBe('Longsword');
      expect(item.itemType).toBe('weapon');
      expect(item.img).toBe('/images/longsword.png');
      expect(item.description).toBe('A sharp longsword');
      expect(item.quantity).toBe(1);
      expect(item.weight).toBe(3);
      expect(item.price).toBe(15);
      expect(item.equipped).toBe(true);
      expect(item.sort).toBe(0);
      expect(item.data).toEqual({ damage: '1d8', damageType: 'slashing' });
    });

    it('should return empty array if actor has no items', async () => {
      await db.delete(items);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/actors/${actorId}/items`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.items).toHaveLength(0);
    });

    it('should return 404 if actor does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/actors/00000000-0000-0000-0000-000000000000/items',
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
        url: `/api/v1/actors/${actorId}/items`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/actors/${actorId}/items`,
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
        url: '/api/v1/actors/invalid-uuid-format/items',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/v1/items/:itemId', () => {
    let itemId: string;

    beforeEach(async () => {
      // Create a test item directly in database
      const [item] = await db.insert(items).values({
        campaignId,
        actorId,
        name: 'Test Item',
        itemType: 'equipment',
        img: '/images/test.png',
        description: 'Test description',
        quantity: 1,
        weight: 1,
        price: 10,
        equipped: false,
        sort: 0,
        data: { custom: 'data' },
      }).returning();

      itemId = item.id;
    });

    it('should get an item by ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/items/${itemId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.item.id).toBe(itemId);
      expect(body.item.name).toBe('Test Item');
      expect(body.item.campaignId).toBe(campaignId);
      expect(body.item.actorId).toBe(actorId);
      expect(body.item.itemType).toBe('equipment');
    });

    it('should return item with all properties', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/items/${itemId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const item = body.item;

      expect(item.id).toBe(itemId);
      expect(item.campaignId).toBe(campaignId);
      expect(item.actorId).toBe(actorId);
      expect(item.name).toBe('Test Item');
      expect(item.description).toBe('Test description');
      expect(item.quantity).toBe(1);
      expect(item.weight).toBe(1);
      expect(item.price).toBe(10);
      expect(item.equipped).toBe(false);
      expect(item.data).toEqual({ custom: 'data' });
      expect(item.img).toBe('/images/test.png');
    });

    it('should return 404 if item does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/items/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Item not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/items/${itemId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/items/${itemId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid item ID format that might cause database errors
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/items/invalid-uuid-format',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/v1/actors/:actorId/items', () => {
    it('should create a new item', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/actors/${actorId}/items`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          campaignId,
          name: 'New Sword',
          itemType: 'weapon',
          img: '/images/sword.png',
          description: 'A new sword',
          quantity: 1,
          weight: 3,
          price: 20,
          equipped: true,
          data: { damage: '1d10' },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.item.name).toBe('New Sword');
      expect(body.item.itemType).toBe('weapon');
      expect(body.item.campaignId).toBe(campaignId);
      expect(body.item.actorId).toBe(actorId);
      expect(body.item.img).toBe('/images/sword.png');
      expect(body.item.description).toBe('A new sword');
      expect(body.item.quantity).toBe(1);
      expect(body.item.weight).toBe(3);
      expect(body.item.price).toBe(20);
      expect(body.item.equipped).toBe(true);
      expect(body.item.data).toEqual({ damage: '1d10' });
    });

    it('should create item with minimal fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/actors/${actorId}/items`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          campaignId,
          name: 'Simple Item',
          itemType: 'misc',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.item.name).toBe('Simple Item');
      expect(body.item.itemType).toBe('misc');
      expect(body.item.campaignId).toBe(campaignId);
      expect(body.item.actorId).toBe(actorId);
      expect(body.item.quantity).toBe(1);
      expect(body.item.weight).toBe(0);
      expect(body.item.price).toBe(0);
      expect(body.item.equipped).toBe(false);
      expect(body.item.data).toEqual({});
      expect(body.item.sort).toBe(0);
    });

    it('should return 400 if name is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/actors/${actorId}/items`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          campaignId,
          itemType: 'weapon',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Item name is required');
    });

    it('should return 400 if name is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/actors/${actorId}/items`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          campaignId,
          name: '   ',
          itemType: 'weapon',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Item name is required');
    });

    it('should return 400 if itemType is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/actors/${actorId}/items`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          campaignId,
          name: 'Test Item',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Item type is required');
    });

    it('should return 400 if itemType is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/actors/${actorId}/items`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          campaignId,
          name: 'Test Item',
          itemType: '   ',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Item type is required');
    });

    it('should return 400 if campaignId is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/actors/${actorId}/items`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Test Item',
          itemType: 'weapon',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Campaign ID is required');
    });

    it('should return 404 if actor does not exist', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/actors/00000000-0000-0000-0000-000000000000/items',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          campaignId,
          name: 'Test Item',
          itemType: 'weapon',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Actor not found');
    });

    it('should return 404 if campaign does not exist', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/actors/${actorId}/items`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          campaignId: '00000000-0000-0000-0000-000000000000',
          name: 'Test Item',
          itemType: 'weapon',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Campaign not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/actors/${actorId}/items`,
        payload: {
          campaignId,
          name: 'Test Item',
          itemType: 'weapon',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/actors/${actorId}/items`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {
          campaignId,
          name: 'Test Item',
          itemType: 'weapon',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/v1/items/:itemId', () => {
    let itemId: string;

    beforeEach(async () => {
      // Create a test item directly in database
      const [item] = await db.insert(items).values({
        campaignId,
        actorId,
        name: 'Original Item',
        itemType: 'weapon',
        img: '/images/original.png',
        description: 'Original description',
        quantity: 1,
        weight: 1,
        price: 10,
        equipped: false,
        sort: 0,
        data: { version: 1 },
      }).returning();

      itemId = item.id;
    });

    it('should update item name', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/items/${itemId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Updated Item',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.item.name).toBe('Updated Item');
      expect(body.item.itemType).toBe('weapon');
    });

    it('should update item quantity and equipped status', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/items/${itemId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          quantity: 5,
          equipped: true,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.item.quantity).toBe(5);
      expect(body.item.equipped).toBe(true);
    });

    it('should update multiple fields', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/items/${itemId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Multi Update',
          itemType: 'armor',
          img: '/images/new.png',
          description: 'New description',
          quantity: 2,
          weight: 5,
          price: 100,
          equipped: true,
          sort: 5,
          data: { version: 2, new: 'field' },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.item.name).toBe('Multi Update');
      expect(body.item.itemType).toBe('armor');
      expect(body.item.img).toBe('/images/new.png');
      expect(body.item.description).toBe('New description');
      expect(body.item.quantity).toBe(2);
      expect(body.item.weight).toBe(5);
      expect(body.item.price).toBe(100);
      expect(body.item.equipped).toBe(true);
      expect(body.item.sort).toBe(5);
      expect(body.item.data).toEqual({ version: 2, new: 'field' });
    });

    it('should return 400 if name is empty', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/items/${itemId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: '   ',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Item name cannot be empty');
    });

    it('should return 400 if itemType is empty', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/items/${itemId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          itemType: '   ',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Item type cannot be empty');
    });

    it('should return 404 if item does not exist', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/items/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Item not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/items/${itemId}`,
        payload: {
          name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/items/${itemId}`,
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
      // Use an invalid item ID format that might cause database errors
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/items/invalid-uuid-format',
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

  describe('DELETE /api/v1/items/:itemId', () => {
    let itemId: string;

    beforeEach(async () => {
      // Create a test item directly in database
      const [item] = await db.insert(items).values({
        campaignId,
        actorId,
        name: 'Item to Delete',
        itemType: 'weapon',
        quantity: 1,
        weight: 1,
        price: 10,
        equipped: false,
        sort: 0,
        data: {},
      }).returning();

      itemId = item.id;
    });

    it('should delete an item', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/items/${itemId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify item was deleted
      const [deletedItem] = await db
        .select()
        .from(items)
        .where(eq(items.id, itemId))
        .limit(1);

      expect(deletedItem).toBeUndefined();
    });

    it('should return 404 if item does not exist', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/items/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Item not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/items/${itemId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/items/${itemId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid item ID format that might cause database errors
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/items/invalid-uuid-format',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });
});
