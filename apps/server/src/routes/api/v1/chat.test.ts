import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../../app.js';
import type { FastifyInstance } from 'fastify';
import { createDb } from '@vtt/database';
import { users, sessions, campaigns, chatMessages } from '@vtt/database';
import { eq } from 'drizzle-orm';

describe('Chat Routes', () => {
  let app: FastifyInstance;
  let db: ReturnType<typeof createDb>;
  let sessionId: string;
  let userId: string;
  let campaignId: string;
  let gameOwnerId: string;

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
    await db.delete(chatMessages);
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
    gameOwnerId = userId;
  });

  describe('GET /api/v1/campaigns/:campaignId/chat', () => {
    beforeEach(async () => {
      // Create test chat messages directly in database
      await db.insert(chatMessages).values([
        {
          campaignId,
          userId,
          content: 'Hello everyone!',
          messageType: 'chat',
          speaker: { name: 'testuser', color: '#000000' },
          rollData: null,
          whisperTargets: null,
          blind: false,
          data: {},
        },
        {
          campaignId,
          userId,
          content: 'I rolled a d20',
          messageType: 'roll',
          speaker: { name: 'testuser', color: '#000000' },
          rollData: { formula: '1d20', result: 15, rolls: [15] },
          whisperTargets: null,
          blind: false,
          data: {},
        },
        {
          campaignId,
          userId,
          content: 'Secret message',
          messageType: 'chat',
          speaker: { name: 'testuser', color: '#000000' },
          rollData: null,
          whisperTargets: null,
          blind: true,
          data: {},
        },
      ]);
    });

    it('should list all chat messages for a campaign', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}/chat`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.chatMessages).toHaveLength(3);
      expect(body.chatMessages[0].campaignId).toBe(campaignId);
      expect(body.pagination).toHaveProperty('limit');
      expect(body.pagination).toHaveProperty('offset');
      expect(body.pagination).toHaveProperty('total');
    });

    it('should return chat message with all properties', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}/chat`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const message = body.chatMessages[0];

      expect(message).toHaveProperty('id');
      expect(message).toHaveProperty('campaignId');
      expect(message).toHaveProperty('userId');
      expect(message).toHaveProperty('content');
      expect(message).toHaveProperty('messageType');
      expect(message).toHaveProperty('speaker');
      expect(message).toHaveProperty('rollData');
      expect(message).toHaveProperty('whisperTargets');
      expect(message).toHaveProperty('blind');
      expect(message).toHaveProperty('timestamp');
      expect(message).toHaveProperty('data');
    });

    it('should return messages in descending order by timestamp', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}/chat`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const messages = body.chatMessages;

      // Check that messages are ordered by timestamp (newest first)
      expect(messages).toHaveLength(3);
      // Verify timestamps are in descending order
      for (let i = 0; i < messages.length - 1; i++) {
        const currentTime = new Date(messages[i].timestamp).getTime();
        const nextTime = new Date(messages[i + 1].timestamp).getTime();
        expect(currentTime).toBeGreaterThanOrEqual(nextTime);
      }
    });

    it('should respect pagination limit', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}/chat?limit=1`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.chatMessages).toHaveLength(1);
      expect(body.pagination.limit).toBe(1);
    });

    it('should respect pagination offset', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}/chat?offset=1`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.chatMessages).toHaveLength(2);
      expect(body.pagination.offset).toBe(1);
    });

    it('should filter messages by type', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}/chat?type=roll`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.chatMessages).toHaveLength(1);
      expect(body.chatMessages[0].messageType).toBe('roll');
      expect(body.chatMessages[0].content).toBe('I rolled a d20');
    });

    it('should enforce maximum limit of 100', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}/chat?limit=200`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.pagination.limit).toBe(100);
    });

    it('should use default limit of 50 if not specified', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}/chat`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.pagination.limit).toBe(50);
    });

    it('should return empty array if campaign has no messages', async () => {
      await db.delete(chatMessages);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}/chat`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.chatMessages).toHaveLength(0);
    });

    it('should filter whisper messages for non-participants', async () => {
      // Create another user
      const otherUserResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'other@example.com',
          username: 'otheruser',
          password: 'password123',
        },
      });

      const otherUserBody = JSON.parse(otherUserResponse.body);
      const otherUserId = otherUserBody.user.id;

      // Create a whisper message not targeting the other user
      await db.insert(chatMessages).values({
        campaignId,
        userId,
        content: 'Private whisper',
        messageType: 'whisper',
        speaker: { name: 'testuser', color: '#000000' },
        rollData: null,
        whisperTargets: { userIds: ['some-other-user-id'] },
        blind: false,
        data: {},
      });

      // Login as the other user (who is not a whisper target)
      const otherUserSession = otherUserBody.sessionId;

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}/chat`,
        headers: {
          authorization: `Bearer ${otherUserSession}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      // Should not see the whisper message
      const whisperMessages = body.chatMessages.filter((m: any) => m.content === 'Private whisper');
      expect(whisperMessages).toHaveLength(0);
    });

    it('should show blind messages to game owner', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}/chat`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      const blindMessages = body.chatMessages.filter((m: any) => m.blind === true);
      expect(blindMessages).toHaveLength(1);
    });

    it('should return 404 if campaign does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/campaigns/00000000-0000-0000-0000-000000000000/chat',
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
        url: `/api/v1/campaigns/${campaignId}/chat`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/campaigns/${campaignId}/chat`,
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
        url: '/api/v1/campaigns/invalid-uuid-format/chat',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/v1/campaigns/:campaignId/chat', () => {
    it('should create a new chat message', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/chat`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          content: 'Hello world!',
          messageType: 'chat',
          speaker: { name: 'testuser', color: '#ff0000' },
          data: { custom: 'value' },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.chatMessage.campaignId).toBe(campaignId);
      expect(body.chatMessage.userId).toBe(userId);
      expect(body.chatMessage.content).toBe('Hello world!');
      expect(body.chatMessage.messageType).toBe('chat');
      expect(body.chatMessage.speaker).toEqual({ name: 'testuser', color: '#ff0000' });
      expect(body.chatMessage.data).toEqual({ custom: 'value' });
    });

    it('should create message with minimal fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/chat`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          content: 'Simple message',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.chatMessage.content).toBe('Simple message');
      expect(body.chatMessage.messageType).toBe('chat');
      expect(body.chatMessage.speaker).toBeNull();
      expect(body.chatMessage.rollData).toBeNull();
      expect(body.chatMessage.whisperTargets).toBeNull();
      expect(body.chatMessage.blind).toBe(false);
      expect(body.chatMessage.data).toEqual({});
    });

    it('should create roll message with roll data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/chat`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          content: 'Rolling for initiative',
          messageType: 'roll',
          rollData: { formula: '1d20+3', result: 18, rolls: [15] },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.chatMessage.messageType).toBe('roll');
      expect(body.chatMessage.rollData).toEqual({ formula: '1d20+3', result: 18, rolls: [15] });
    });

    it('should create whisper message', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/chat`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          content: 'Secret whisper',
          messageType: 'whisper',
          whisperTargets: { userIds: ['user-id-1', 'user-id-2'] },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.chatMessage.messageType).toBe('whisper');
      expect(body.chatMessage.whisperTargets).toEqual({ userIds: ['user-id-1', 'user-id-2'] });
    });

    it('should create blind roll message', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/chat`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          content: 'Blind roll',
          messageType: 'roll',
          rollData: { formula: '1d20', result: 10, rolls: [10] },
          blind: true,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.chatMessage.blind).toBe(true);
      expect(body.chatMessage.messageType).toBe('roll');
    });

    it('should trim whitespace from content', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/chat`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          content: '   Hello with spaces   ',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.chatMessage.content).toBe('Hello with spaces');
    });

    it('should return 400 if content is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/chat`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          messageType: 'chat',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Message content is required');
    });

    it('should return 400 if content is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/chat`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          content: '   ',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Message content is required');
    });

    it('should return 404 if campaign does not exist', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/campaigns/00000000-0000-0000-0000-000000000000/chat',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
        payload: {
          content: 'Test message',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Campaign not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/chat`,
        payload: {
          content: 'Test message',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/campaigns/${campaignId}/chat`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
        payload: {
          content: 'Test message',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/v1/chat/:messageId', () => {
    let messageId: string;
    let otherUserSessionId: string;
    let otherUserId: string;

    beforeEach(async () => {
      // Create a test chat message
      const [message] = await db.insert(chatMessages).values({
        campaignId,
        userId,
        content: 'Message to delete',
        messageType: 'chat',
        speaker: null,
        rollData: null,
        whisperTargets: null,
        blind: false,
        data: {},
      }).returning();

      messageId = message.id;

      // Create another user for authorization tests
      const otherUserResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'other@example.com',
          username: 'otheruser',
          password: 'password123',
        },
      });

      const otherUserBody = JSON.parse(otherUserResponse.body);
      otherUserSessionId = otherUserBody.sessionId;
      otherUserId = otherUserBody.user.id;
    });

    it('should delete own message', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/chat/${messageId}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify message was deleted
      const [deletedMessage] = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.id, messageId))
        .limit(1);

      expect(deletedMessage).toBeUndefined();
    });

    it('should allow GM to delete any message', async () => {
      // Create a message from the other user in the game owned by the first user
      const [otherMessage] = await db.insert(chatMessages).values({
        campaignId,
        userId: otherUserId,
        content: 'Other user message',
        messageType: 'chat',
        speaker: null,
        rollData: null,
        whisperTargets: null,
        blind: false,
        data: {},
      }).returning();

      // Game owner (GM) should be able to delete it
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/chat/${otherMessage.id}`,
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify message was deleted
      const [deletedMessage] = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.id, otherMessage.id))
        .limit(1);

      expect(deletedMessage).toBeUndefined();
    });

    it('should return 403 if user tries to delete another users message', async () => {
      // Try to delete the first user's message as the other user
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/chat/${messageId}`,
        headers: {
          authorization: `Bearer ${otherUserSessionId}`,
        },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Forbidden: You can only delete your own messages unless you are the GM');

      // Verify message was NOT deleted
      const [existingMessage] = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.id, messageId))
        .limit(1);

      expect(existingMessage).toBeDefined();
    });

    it('should return 404 if message does not exist', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/chat/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Chat message not found');
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/chat/${messageId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid session', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/chat/${messageId}`,
        headers: {
          authorization: 'Bearer invalid-session-id',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Use an invalid message ID format that might cause database errors
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/chat/invalid-uuid-format',
        headers: {
          authorization: `Bearer ${sessionId}`,
        },
      });

      // Should return an error (either 404 or 500)
      expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });
  });
});
