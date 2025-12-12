import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { createDb } from '@vtt/database';
import { users, sessions, campaigns, STORAGE_QUOTAS } from '@vtt/database';
import { eq } from 'drizzle-orm';

describe('Campaigns Routes', () => {
  let app: FastifyInstance;
  let db: ReturnType<typeof createDb>;
  let sessionId: string;
  let userId: string;
  let otherSessionId: string;
  let otherUserId: string;

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

    // Create a second test user
    const otherRegisterResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'other@example.com',
        username: 'otheruser',
        password: 'password123',
      },
    });

    const otherRegisterBody = JSON.parse(otherRegisterResponse.body);
    otherSessionId = otherRegisterBody.sessionId;
    otherUserId = otherRegisterBody.user.id;
  });

  describe('POST /api/v1/campaigns', () => {
    it('should create a new campaign with valid data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Test Campaign',
          gameSystemId: 'dnd5e',
          settings: {
            gridType: 'hex',
            gridSize: 75,
            snapToGrid: false,
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('campaign');
      expect(body.campaign.name).toBe('Test Campaign');
      expect(body.campaign.ownerId).toBe(userId);
      expect(body.campaign.gameSystemId).toBe('dnd5e');
      expect(body.campaign.settings.gridType).toBe('hex');
      expect(body.campaign.settings.gridSize).toBe(75);
      expect(body.campaign.settings.snapToGrid).toBe(false);
    });

    it('should create a campaign with default settings', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Test Campaign',
          gameSystemId: 'dnd5e',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.campaign.settings.gridType).toBe('square');
      expect(body.campaign.settings.gridSize).toBe(50);
      expect(body.campaign.settings.snapToGrid).toBe(true);
    });

    it('should trim whitespace from campaign name', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: '  Test Campaign  ',
          gameSystemId: 'dnd5e',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.campaign.name).toBe('Test Campaign');
    });

    it('should return 400 if name is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          gameSystemId: 'dnd5e',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Campaign name is required');
    });

    it('should return 400 if name is empty string', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: '',
          gameSystemId: 'dnd5e',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Campaign name is required');
    });

    it('should return 400 if name is only whitespace', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: '   ',
          gameSystemId: 'dnd5e',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Campaign name is required');
    });

    it('should return 400 if gameSystemId is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Test Campaign',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Game system ID is required');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns',
        payload: {
          name: 'Test Campaign',
          gameSystemId: 'dnd5e',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns',
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {
          name: 'Test Campaign',
          gameSystemId: 'dnd5e',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should auto-upgrade user from basic to gm tier when creating first campaign', async () => {
      // Verify user starts with basic tier
      const [userBefore] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      expect(userBefore.accountTier).toBe('basic');
      expect(userBefore.storageQuotaBytes).toBe(STORAGE_QUOTAS.basic);

      // Create campaign
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'First Campaign',
          gameSystemId: 'dnd5e',
        },
      });

      expect(response.statusCode).toBe(201);

      // Verify user has been upgraded to GM tier
      const [userAfter] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      expect(userAfter.accountTier).toBe('gm');
      expect(userAfter.storageQuotaBytes).toBe(STORAGE_QUOTAS.gm);
    });

    it('should not downgrade user if they already have gm tier', async () => {
      // Upgrade user to GM tier first
      await db
        .update(users)
        .set({
          accountTier: 'gm',
          storageQuotaBytes: STORAGE_QUOTAS.gm,
        })
        .where(eq(users.id, userId));

      // Create campaign
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Test Campaign',
          gameSystemId: 'dnd5e',
        },
      });

      expect(response.statusCode).toBe(201);

      // Verify user still has GM tier
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      expect(user.accountTier).toBe('gm');
      expect(user.storageQuotaBytes).toBe(STORAGE_QUOTAS.gm);
    });
  });

  describe('GET /api/v1/campaigns', () => {
    beforeEach(async () => {
      // Create campaigns for test user
      await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Campaign 1',
          gameSystemId: 'dnd5e',
        },
      });

      await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Campaign 2',
          gameSystemId: 'pf2e',
        },
      });

      // Create campaign for other user
      await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns',
        headers: {
          authorization: `Bearer ${otherSessionId}`,
        },
        payload: {
          name: 'Other User Campaign',
          gameSystemId: 'dnd5e',
        },
      });
    });

    it('should list campaigns owned by the authenticated user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/campaigns',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.campaigns).toHaveLength(2);
      expect(body.campaigns[0].name).toBe('Campaign 1');
      expect(body.campaigns[1].name).toBe('Campaign 2');
      expect(body.campaigns[0].ownerId).toBe(userId);
      expect(body.campaigns[1].ownerId).toBe(userId);
    });

    it('should not include campaigns owned by other users', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/campaigns',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.campaigns).toHaveLength(2);
      expect(body.campaigns.every((c: any) => c.name !== 'Other User Campaign')).toBe(true);
    });

    it('should return empty array if user has no campaigns', async () => {
      // Clean up all campaigns
      await db.delete(campaigns);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/campaigns',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.campaigns).toHaveLength(0);
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/campaigns',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/campaigns',
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/campaigns/:id', () => {
    let campaignId: string;
    let otherCampaignId: string;

    beforeEach(async () => {
      // Create campaign for test user
      const campaignResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Test Campaign',
          gameSystemId: 'dnd5e',
        },
      });
      const campaignBody = JSON.parse(campaignResponse.body);
      campaignId = campaignBody.campaign.id;

      // Create campaign for other user
      const otherCampaignResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns',
        headers: {
          authorization: `Bearer ${otherSessionId}`,
        },
        payload: {
          name: 'Other User Campaign',
          gameSystemId: 'dnd5e',
        },
      });
      const otherCampaignBody = JSON.parse(otherCampaignResponse.body);
      otherCampaignId = otherCampaignBody.campaign.id;
    });

    it('should get a campaign by ID when user is the owner', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.campaign.id).toBe(campaignId);
      expect(body.campaign.name).toBe('Test Campaign');
      expect(body.campaign.ownerId).toBe(userId);
    });

    it('should return 404 if campaign does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/campaigns/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Campaign not found');
    });

    it('should return 403 if user is not the owner', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${otherCampaignId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Access denied');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/v1/campaigns/:id', () => {
    let campaignId: string;
    let otherCampaignId: string;

    beforeEach(async () => {
      // Create campaign for test user
      const campaignResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Test Campaign',
          gameSystemId: 'dnd5e',
          settings: {
            gridType: 'square',
            gridSize: 50,
            snapToGrid: true,
          },
        },
      });
      const campaignBody = JSON.parse(campaignResponse.body);
      campaignId = campaignBody.campaign.id;

      // Create campaign for other user
      const otherCampaignResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns',
        headers: {
          authorization: `Bearer ${otherSessionId}`,
        },
        payload: {
          name: 'Other User Campaign',
          gameSystemId: 'dnd5e',
        },
      });
      const otherCampaignBody = JSON.parse(otherCampaignResponse.body);
      otherCampaignId = otherCampaignBody.campaign.id;
    });

    it('should update campaign name', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/campaigns/${campaignId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Updated Campaign Name',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.campaign.name).toBe('Updated Campaign Name');
      expect(body.campaign.id).toBe(campaignId);
    });

    it('should update campaign settings', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/campaigns/${campaignId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          settings: {
            gridType: 'hex',
            gridSize: 100,
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.campaign.settings.gridType).toBe('hex');
      expect(body.campaign.settings.gridSize).toBe(100);
      expect(body.campaign.settings.snapToGrid).toBe(true); // Should preserve existing setting
    });

    it('should update both name and settings', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/campaigns/${campaignId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Updated Name',
          settings: {
            gridType: 'hex',
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.campaign.name).toBe('Updated Name');
      expect(body.campaign.settings.gridType).toBe('hex');
    });

    it('should trim whitespace from updated name', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/campaigns/${campaignId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: '  Updated Name  ',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.campaign.name).toBe('Updated Name');
    });

    it('should return 400 if no fields are provided', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/campaigns/${campaignId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('At least one field (name or settings) is required');
    });

    it('should return 400 if name is empty', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/campaigns/${campaignId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: '',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('At least one field (name or settings) is required');
    });

    it('should return 400 if name is only whitespace', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/campaigns/${campaignId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: '   ',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Campaign name cannot be empty');
    });

    it('should return 404 if campaign does not exist', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/campaigns/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Campaign not found');
    });

    it('should return 403 if user is not the owner', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/campaigns/${otherCampaignId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Only the owner can update this campaign');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/campaigns/${campaignId}`,
        payload: {
          name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/campaigns/${campaignId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {
          name: 'Updated Name',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should prevent changing gameSystemId once set', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/campaigns/${campaignId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          gameSystemId: 'pf2e',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Cannot change game system once set. The game system is immutable after campaign creation.');
    });
  });

  describe('DELETE /api/v1/campaigns/:id', () => {
    let campaignId: string;
    let otherCampaignId: string;

    beforeEach(async () => {
      // Create campaign for test user
      const campaignResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          name: 'Test Campaign',
          gameSystemId: 'dnd5e',
        },
      });
      const campaignBody = JSON.parse(campaignResponse.body);
      campaignId = campaignBody.campaign.id;

      // Create campaign for other user
      const otherCampaignResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns',
        headers: {
          authorization: `Bearer ${otherSessionId}`,
        },
        payload: {
          name: 'Other User Campaign',
          gameSystemId: 'dnd5e',
        },
      });
      const otherCampaignBody = JSON.parse(otherCampaignResponse.body);
      otherCampaignId = otherCampaignBody.campaign.id;
    });

    it('should delete a campaign when user is the owner', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/campaigns/${campaignId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);

      // Verify campaign is deleted from database
      const [deletedCampaign] = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, campaignId))
        .limit(1);

      expect(deletedCampaign).toBeUndefined();
    });

    it('should return 404 if campaign does not exist', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/campaigns/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Campaign not found');
    });

    it('should return 403 if user is not the owner', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/campaigns/${otherCampaignId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Only the owner can delete this campaign');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/campaigns/${campaignId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/campaigns/${campaignId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
