import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { buildApp } from '../../app.js';
import type { FastifyInstance } from 'fastify';
import { users, sessions, tokens, scenes, walls, campaigns } from '@vtt/database';
import { eq } from 'drizzle-orm';
import type { WebSocket } from '@fastify/websocket';
import type { WSMessage } from '@vtt/shared';

// Mock WebSocket factory
function createMockWebSocket(readyState = 1): WebSocket {
  return {
    send: vi.fn(),
    close: vi.fn(),
    readyState,
    on: vi.fn(),
    off: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as WebSocket;
}

// Helper to parse last sent message from mock socket
function getLastSentMessage<T = unknown>(socket: WebSocket): WSMessage<T> | null {
  const sendMock = socket.send as ReturnType<typeof vi.fn>;
  if (sendMock.mock.calls.length === 0) return null;
  const lastCall = sendMock.mock.calls[sendMock.mock.calls.length - 1];
  return JSON.parse(lastCall[0]);
}

// Helper to get all sent messages
function getAllSentMessages<T = unknown>(socket: WebSocket): WSMessage<T>[] {
  const sendMock = socket.send as ReturnType<typeof vi.fn>;
  return sendMock.mock.calls.map((call) => JSON.parse(call[0]));
}

describe('Campaign WebSocket Handler', () => {
  let app: FastifyInstance;
  let testUserId: string;
  let testSessionId: string;
  let testCampaignId: string;
  let testSceneId: string;

  beforeAll(async () => {
    app = await buildApp({
      NODE_ENV: 'test',
      PORT: 3011,
      HOST: '0.0.0.0',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://claude:Claude^YV18@localhost:5432/vtt_test',
      REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
      CORS_ORIGIN: '*',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data in correct order (delete children first, following foreign key constraints)
    await app.db.delete(tokens);
    await app.db.delete(walls);
    await app.db.delete(scenes);
    await app.db.delete(sessions);
    await app.db.delete(campaigns);
    await app.db.delete(users);

    // Create test user and session
    const [user] = await app.db
      .insert(users)
      .values({
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hash',
      })
      .returning();

    testUserId = user.id;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const [session] = await app.db
      .insert(sessions)
      .values({
        userId: testUserId,
        expiresAt: futureDate,
      })
      .returning();

    testSessionId = session.id;

    // Create test campaign
    const [campaign] = await app.db
      .insert(campaigns)
      .values({
        ownerId: testUserId,
        name: 'Test Campaign',
        settings: {},
      })
      .returning();

    testCampaignId = campaign.id;

    // Create test scene
    const [scene] = await app.db
      .insert(scenes)
      .values({
        campaignId: testCampaignId,
        name: 'Test Scene',
        active: true,
        backgroundImage: 'test.jpg',
        backgroundWidth: 1000,
        backgroundHeight: 1000,
        gridType: 'square',
        gridSize: 50,
        gridColor: '#000000',
        gridAlpha: 0.5,
        gridDistance: 5,
        gridUnits: 'ft',
        tokenVision: true,
        fogExploration: false,
        globalLight: true,
        darkness: 0,
        initialX: 0,
        initialY: 0,
        initialScale: 1,
        navOrder: 0,
        data: {},
      })
      .returning();

    testSceneId = scene.id;
  });

  describe('ping handler', () => {
    it('should respond with pong to ping message', async () => {
      const mockSocket = createMockWebSocket();

      // Simulate WebSocket connection
      const { handleCampaignWebSocket } = await import('./campaign.js');

      // Create mock request
      const mockRequest = {
        id: 'test-client-id',
        log: {
          info: vi.fn(),
          debug: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
        server: app,
      } as any;

      // Trigger connection
      await handleCampaignWebSocket(mockSocket, mockRequest);

      // Get the message handler
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      expect(messageHandler).toBeDefined();

      // Clear previous calls
      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      // Send ping
      const pingMessage: WSMessage = {
        type: 'ping',
        payload: {},
        timestamp: Date.now(),
      };

      await messageHandler(Buffer.from(JSON.stringify(pingMessage)));

      // Verify pong response
      const lastMessage = getLastSentMessage(mockSocket);
      expect(lastMessage?.type).toBe('pong');
    });
  });

  describe('campaign:join handler', () => {
    it('should allow user to join campaign with valid token', async () => {
      const mockSocket = createMockWebSocket();

      const { handleCampaignWebSocket } = await import('./campaign.js');
      const mockRequest = {
        id: 'test-client-id',
        log: {
          info: vi.fn(),
          debug: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);

      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      const joinMessage: WSMessage = {
        type: 'campaign:join',
        payload: {
          campaignId: testCampaignId,
          token: testSessionId,
        },
        timestamp: Date.now(),
      };

      await messageHandler(Buffer.from(JSON.stringify(joinMessage)));

      const messages = getAllSentMessages(mockSocket);
      const playersMessage = messages.find((m) => m.type === 'campaign:players');

      expect(playersMessage).toBeDefined();
      expect(playersMessage?.payload.players).toHaveLength(1);
      expect(playersMessage?.payload.players[0].userId).toBe(testUserId);
      expect(playersMessage?.payload.players[0].username).toBe('testuser');
    });

    it('should reject join with invalid token', async () => {
      const mockSocket = createMockWebSocket();

      const { handleCampaignWebSocket } = await import('./campaign.js');
      const mockRequest = {
        id: 'test-client-id',
        log: {
          info: vi.fn(),
          debug: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);

      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      const joinMessage: WSMessage = {
        type: 'campaign:join',
        payload: {
          campaignId: testCampaignId,
          token: 'invalid-token',
        },
        timestamp: Date.now(),
      };

      await messageHandler(Buffer.from(JSON.stringify(joinMessage)));

      const lastMessage = getLastSentMessage(mockSocket);
      expect(lastMessage?.type).toBe('error');
      expect(lastMessage?.payload.message).toBe('Invalid or expired session');
      expect(lastMessage?.payload.code).toBe('UNAUTHORIZED');
    });

    it('should notify other players when someone joins', async () => {
      // First player joins
      const mockSocket1 = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest1 = {
        id: 'client-1',
        log: {
          info: vi.fn(),
          debug: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket1, mockRequest1);

      const messageHandler1 = (mockSocket1.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      const joinMessage1: WSMessage = {
        type: 'campaign:join',
        payload: {
          campaignId: testCampaignId,
          token: testSessionId,
        },
        timestamp: Date.now(),
      };

      await messageHandler1(Buffer.from(JSON.stringify(joinMessage1)));

      // Create second user
      const [user2] = await app.db
        .insert(users)
        .values({
          email: 'test2@example.com',
          username: 'testuser2',
          passwordHash: 'hash',
        })
        .returning();

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const [session2] = await app.db
        .insert(sessions)
        .values({
          userId: user2.id,
          expiresAt: futureDate,
        })
        .returning();

      // Second player joins
      const mockSocket2 = createMockWebSocket();
      const mockRequest2 = {
        id: 'client-2',
        log: {
          info: vi.fn(),
          debug: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket2, mockRequest2);

      const messageHandler2 = (mockSocket2.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      (mockSocket1.send as ReturnType<typeof vi.fn>).mockClear();

      const joinMessage2: WSMessage = {
        type: 'campaign:join',
        payload: {
          campaignId: testCampaignId,
          token: session2.id,
        },
        timestamp: Date.now(),
      };

      await messageHandler2(Buffer.from(JSON.stringify(joinMessage2)));

      // Check that socket1 received player-joined notification
      const messages1 = getAllSentMessages(mockSocket1);
      const joinedMessage = messages1.find((m) => m.type === 'campaign:player-joined');

      expect(joinedMessage).toBeDefined();
      expect(joinedMessage?.payload.player.userId).toBe(user2.id);
      expect(joinedMessage?.payload.player.username).toBe('testuser2');
    });
  });

  describe('campaign:leave handler', () => {
    it('should remove player from room', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: {
          info: vi.fn(),
          debug: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);

      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      // Join first
      const joinMessage: WSMessage = {
        type: 'campaign:join',
        payload: {
          campaignId: testCampaignId,
          token: testSessionId,
        },
        timestamp: Date.now(),
      };

      await messageHandler(Buffer.from(JSON.stringify(joinMessage)));

      // Then leave
      const leaveMessage: WSMessage = {
        type: 'campaign:leave',
        payload: {
          campaignId: testCampaignId,
        },
        timestamp: Date.now(),
      };

      await messageHandler(Buffer.from(JSON.stringify(leaveMessage)));

      // Import roomManager to verify
      const { roomManager } = await import('../rooms.js');
      expect(roomManager.getRoomForSocket(mockSocket)).toBeNull();
    });

    it('should notify other players when someone leaves', async () => {
      // Setup two players
      const mockSocket1 = createMockWebSocket();
      const mockSocket2 = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      // First player
      const mockRequest1 = {
        id: 'client-1',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket1, mockRequest1);
      const messageHandler1 = (mockSocket1.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler1(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      // Second player
      const [user2] = await app.db.insert(users).values({
        email: 'test2@example.com',
        username: 'testuser2',
        passwordHash: 'hash',
      }).returning();

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const [session2] = await app.db.insert(sessions).values({
        userId: user2.id,
        expiresAt: futureDate,
      }).returning();

      const mockRequest2 = {
        id: 'client-2',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket2, mockRequest2);
      const messageHandler2 = (mockSocket2.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler2(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: session2.id },
        timestamp: Date.now(),
      })));

      (mockSocket1.send as ReturnType<typeof vi.fn>).mockClear();

      // Second player leaves
      await messageHandler2(Buffer.from(JSON.stringify({
        type: 'campaign:leave',
        payload: { campaignId: testCampaignId },
        timestamp: Date.now(),
      })));

      // Check socket1 received notification
      const messages = getAllSentMessages(mockSocket1);
      const leftMessage = messages.find((m) => m.type === 'campaign:player-left');

      expect(leftMessage).toBeDefined();
      expect(leftMessage?.payload.userId).toBe(user2.id);
    });
  });

  describe('token:move handler', () => {
    let tokenId: string;

    beforeEach(async () => {
      // Create a test token
      const [token] = await app.db
        .insert(tokens)
        .values({
          sceneId: testSceneId,
          name: 'Test Token',
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          ownerId: testUserId,
        })
        .returning();

      tokenId = token.id;
    });

    it('should update token position in database', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      // Join game first
      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      // Move token
      const moveMessage: WSMessage = {
        type: 'token:move',
        payload: {
          tokenId,
          x: 100,
          y: 150,
        },
        timestamp: Date.now(),
      };

      await messageHandler(Buffer.from(JSON.stringify(moveMessage)));

      // Verify database was updated
      const [updatedToken] = await app.db
        .select()
        .from(tokens)
        .where(eq(tokens.id, tokenId))
        .limit(1);

      expect(updatedToken.x).toBe(100);
      expect(updatedToken.y).toBe(150);
    });

    it('should broadcast token move to all players in room', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'token:move',
        payload: { tokenId, x: 100, y: 150 },
        timestamp: Date.now(),
      })));

      const messages = getAllSentMessages(mockSocket);
      const moveMessage = messages.find((m) => m.type === 'token:move');

      expect(moveMessage).toBeDefined();
      expect(moveMessage?.payload.tokenId).toBe(tokenId);
      expect(moveMessage?.payload.x).toBe(100);
      expect(moveMessage?.payload.y).toBe(150);
    });

    it('should return error if token not found', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'token:move',
        payload: { tokenId: '00000000-0000-0000-0000-000000000099', x: 100, y: 150 },
        timestamp: Date.now(),
      })));

      const lastMessage = getLastSentMessage(mockSocket);
      expect(lastMessage?.type).toBe('error');
      // Accept either specific or generic error message
      expect(['Token not found', 'Failed to update token position']).toContain(lastMessage?.payload.message);
    });

    it('should return error if not in a campaign room', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      // Try to move without joining
      await messageHandler(Buffer.from(JSON.stringify({
        type: 'token:move',
        payload: { tokenId, x: 100, y: 150 },
        timestamp: Date.now(),
      })));

      const lastMessage = getLastSentMessage(mockSocket);
      expect(lastMessage?.type).toBe('error');
      expect(lastMessage?.payload.message).toBe('Not in a campaign room');
    });
  });

  describe('token:add handler', () => {
    it('should create new token in database', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'token:add',
        payload: {
          sceneId: testSceneId,
          name: 'New Token',
          x: 50,
          y: 75,
          width: 2,
          height: 2,
        },
        timestamp: Date.now(),
      })));

      // Verify token was created
      const tokensList = await app.db
        .select()
        .from(tokens)
        .where(eq(tokens.name, 'New Token'));

      expect(tokensList).toHaveLength(1);
      expect(tokensList[0].x).toBe(50);
      expect(tokensList[0].y).toBe(75);
      expect(tokensList[0].ownerId).toBe(testUserId);
    });

    it('should broadcast token:added to all players', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'token:add',
        payload: {
          sceneId: testSceneId,
          name: 'New Token',
          x: 50,
          y: 75,
        },
        timestamp: Date.now(),
      })));

      const messages = getAllSentMessages(mockSocket);
      const addedMessage = messages.find((m) => m.type === 'token:added');

      expect(addedMessage).toBeDefined();
      expect(addedMessage?.payload.token.name).toBe('New Token');
      expect(addedMessage?.payload.token.x).toBe(50);
      expect(addedMessage?.payload.token.y).toBe(75);
      expect(addedMessage?.payload.token.id).toBeDefined();
    });

    it('should return error if sceneId is missing', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'token:add',
        payload: {
          name: 'New Token',
          x: 50,
          y: 75,
        },
        timestamp: Date.now(),
      })));

      const lastMessage = getLastSentMessage(mockSocket);
      expect(lastMessage?.type).toBe('error');
      expect(lastMessage?.payload.message).toBe('sceneId is required to add a token');
    });

    it('should set default values for optional fields', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'token:add',
        payload: {
          sceneId: testSceneId,
          name: 'Minimal Token',
          x: 0,
          y: 0,
        },
        timestamp: Date.now(),
      })));

      const [token] = await app.db
        .select()
        .from(tokens)
        .where(eq(tokens.name, 'Minimal Token'));

      expect(token.width).toBe(1);
      expect(token.height).toBe(1);
      expect(token.visible).toBe(true);
      expect(token.elevation).toBe(0);
      expect(token.rotation).toBe(0);
      expect(token.locked).toBe(false);
    });
  });

  describe('token:remove handler', () => {
    let tokenId: string;

    beforeEach(async () => {
      const [token] = await app.db
        .insert(tokens)
        .values({
          sceneId: testSceneId,
          name: 'Test Token',
          x: 0,
          y: 0,
          ownerId: testUserId,
        })
        .returning();

      tokenId = token.id;
    });

    it('should delete token from database', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'token:remove',
        payload: { tokenId },
        timestamp: Date.now(),
      })));

      const tokensList = await app.db
        .select()
        .from(tokens)
        .where(eq(tokens.id, tokenId));

      expect(tokensList).toHaveLength(0);
    });

    it('should broadcast token:removed to all players', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'token:remove',
        payload: { tokenId },
        timestamp: Date.now(),
      })));

      const messages = getAllSentMessages(mockSocket);
      const removedMessage = messages.find((m) => m.type === 'token:removed');

      expect(removedMessage).toBeDefined();
      expect(removedMessage?.payload.tokenId).toBe(tokenId);
    });

    it('should return error if token not found', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'token:remove',
        payload: { tokenId: '00000000-0000-0000-0000-000000000099' },
        timestamp: Date.now(),
      })));

      const lastMessage = getLastSentMessage(mockSocket);
      expect(lastMessage?.type).toBe('error');
      expect(['Token not found', 'Failed to remove token']).toContain(lastMessage?.payload.message);
    });
  });

  describe('dice:roll handler', () => {
    it('should parse dice notation and broadcast result', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'dice:roll',
        payload: {
          notation: '2d6+3',
          label: 'Attack roll',
        },
        timestamp: Date.now(),
      })));

      const messages = getAllSentMessages(mockSocket);
      const resultMessage = messages.find((m) => m.type === 'dice:result');

      expect(resultMessage).toBeDefined();
      expect(resultMessage?.payload.notation).toBe('2d6+3');
      expect(resultMessage?.payload.label).toBe('Attack roll');
      expect(resultMessage?.payload.userId).toBe(testUserId);
      expect(resultMessage?.payload.username).toBe('testuser');
      expect(resultMessage?.payload.rolls).toHaveLength(1);
      expect(resultMessage?.payload.modifiers).toBe(3);
      expect(resultMessage?.payload.total).toBeGreaterThanOrEqual(5); // min 2+3
      expect(resultMessage?.payload.total).toBeLessThanOrEqual(15); // max 12+3
    });

    it('should handle complex dice notation with keep highest', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'dice:roll',
        payload: { notation: '4d6kh3' },
        timestamp: Date.now(),
      })));

      const messages = getAllSentMessages(mockSocket);
      const resultMessage = messages.find((m) => m.type === 'dice:result');

      expect(resultMessage).toBeDefined();
      expect(resultMessage?.payload.rolls[0].results).toHaveLength(4);
      expect(resultMessage?.payload.rolls[0].kept).toHaveLength(3);
    });

    it('should return error for invalid dice notation', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'dice:roll',
        payload: { notation: 'invalid-notation' },
        timestamp: Date.now(),
      })));

      const lastMessage = getLastSentMessage(mockSocket);
      expect(lastMessage?.type).toBe('error');
      expect(lastMessage?.payload.message).toBeDefined();
    });

    it('should return error if not in a campaign room', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'dice:roll',
        payload: { notation: '1d20' },
        timestamp: Date.now(),
      })));

      const lastMessage = getLastSentMessage(mockSocket);
      expect(lastMessage?.type).toBe('error');
      expect(lastMessage?.payload.message).toBe('Not in a campaign room');
    });
  });

  describe('chat:message handler', () => {
    it('should broadcast chat message to all players', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'chat:message',
        payload: { text: 'Hello, world!' },
        timestamp: Date.now(),
      })));

      const messages = getAllSentMessages(mockSocket);
      const chatMessage = messages.find((m) => m.type === 'chat:message');

      expect(chatMessage).toBeDefined();
      expect(chatMessage?.payload.text).toBe('Hello, world!');
      expect(chatMessage?.payload.userId).toBe(testUserId);
      expect(chatMessage?.payload.username).toBe('testuser');
    });

    it('should override userId and username from payload with authenticated user', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      // Try to send chat with fake user info
      await messageHandler(Buffer.from(JSON.stringify({
        type: 'chat:message',
        payload: {
          text: 'Hello!',
          userId: 'fake-user-id',
          username: 'FakeUser',
        },
        timestamp: Date.now(),
      })));

      const messages = getAllSentMessages(mockSocket);
      const chatMessage = messages.find((m) => m.type === 'chat:message');

      // Should use authenticated user info, not payload
      expect(chatMessage?.payload.userId).toBe(testUserId);
      expect(chatMessage?.payload.username).toBe('testuser');
    });

    it('should return error if not in a campaign room', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'chat:message',
        payload: { text: 'Hello!' },
        timestamp: Date.now(),
      })));

      const lastMessage = getLastSentMessage(mockSocket);
      expect(lastMessage?.type).toBe('error');
      expect(lastMessage?.payload.message).toBe('Not in a campaign room');
    });
  });

  describe('scene:switch handler', () => {
    it('should fetch scene from database and broadcast to all players', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'scene:switch',
        payload: { sceneId: testSceneId },
        timestamp: Date.now(),
      })));

      const messages = getAllSentMessages(mockSocket);
      const switchedMessage = messages.find((m) => m.type === 'scene:switched');

      expect(switchedMessage).toBeDefined();
      expect(switchedMessage?.payload.scene.id).toBe(testSceneId);
      expect(switchedMessage?.payload.scene.name).toBe('Test Scene');
    });

    it('should return error if scene not found', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'scene:switch',
        payload: { sceneId: '00000000-0000-0000-0000-000000000099' },
        timestamp: Date.now(),
      })));

      const lastMessage = getLastSentMessage(mockSocket);
      expect(lastMessage?.type).toBe('error');
      expect(['Scene not found', 'Failed to switch scene']).toContain(lastMessage?.payload.message);
    });
  });

  describe('scene:update handler', () => {
    it('should update scene in database and broadcast changes', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'scene:update',
        payload: {
          sceneId: testSceneId,
          updates: {
            name: 'Updated Scene Name',
            darkness: 0.5,
          },
        },
        timestamp: Date.now(),
      })));

      // Verify database was updated
      const [updatedScene] = await app.db
        .select()
        .from(scenes)
        .where(eq(scenes.id, testSceneId));

      expect(updatedScene.name).toBe('Updated Scene Name');
      expect(updatedScene.darkness).toBe(0.5);

      // Verify broadcast
      const messages = getAllSentMessages(mockSocket);
      const updatedMessage = messages.find((m) => m.type === 'scene:updated');

      expect(updatedMessage).toBeDefined();
      expect(updatedMessage?.payload.scene.name).toBe('Updated Scene Name');
      expect(updatedMessage?.payload.scene.darkness).toBe(0.5);
    });

    it('should return error if scene not found', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'scene:update',
        payload: {
          sceneId: '00000000-0000-0000-0000-000000000099',
          updates: { name: 'New Name' },
        },
        timestamp: Date.now(),
      })));

      const lastMessage = getLastSentMessage(mockSocket);
      expect(lastMessage?.type).toBe('error');
      expect(['Scene not found', 'Failed to update scene']).toContain(lastMessage?.payload.message);
    });
  });

  describe('wall:add handler', () => {
    it('should create wall in database and broadcast to all players', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'wall:add',
        payload: {
          sceneId: testSceneId,
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 100,
          wallType: 'wall',
        },
        timestamp: Date.now(),
      })));

      // Verify database
      const wallsList = await app.db.select().from(walls);
      expect(wallsList).toHaveLength(1);
      expect(wallsList[0].x1).toBe(0);
      expect(wallsList[0].x2).toBe(100);

      // Verify broadcast
      const messages = getAllSentMessages(mockSocket);
      const addedMessage = messages.find((m) => m.type === 'wall:added');

      expect(addedMessage).toBeDefined();
      expect(addedMessage?.payload.wall.x1).toBe(0);
      expect(addedMessage?.payload.wall.x2).toBe(100);
    });

    it('should set default values for optional wall properties', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'wall:add',
        payload: {
          sceneId: testSceneId,
          x1: 0,
          y1: 0,
          x2: 50,
          y2: 50,
        },
        timestamp: Date.now(),
      })));

      const [wall] = await app.db.select().from(walls);

      expect(wall.wallType).toBe('wall');
      expect(wall.move).toBe('block');
      expect(wall.sense).toBe('block');
      expect(wall.sound).toBe('block');
      expect(wall.door).toBe('none');
      expect(wall.doorState).toBe('closed');
    });
  });

  describe('wall:update handler', () => {
    let wallId: string;

    beforeEach(async () => {
      const [wall] = await app.db
        .insert(walls)
        .values({
          sceneId: testSceneId,
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 100,
        })
        .returning();

      wallId = wall.id;
    });

    it('should update wall in database and broadcast changes', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'wall:update',
        payload: {
          wallId,
          updates: {
            x2: 200,
            y2: 200,
            door: 'standard',
            doorState: 'open',
          },
        },
        timestamp: Date.now(),
      })));

      // Verify database
      const [updatedWall] = await app.db
        .select()
        .from(walls)
        .where(eq(walls.id, wallId));

      expect(updatedWall.x2).toBe(200);
      expect(updatedWall.y2).toBe(200);
      expect(updatedWall.door).toBe('standard');
      expect(updatedWall.doorState).toBe('open');

      // Verify broadcast
      const messages = getAllSentMessages(mockSocket);
      const updatedMessage = messages.find((m) => m.type === 'wall:updated');

      expect(updatedMessage).toBeDefined();
      expect(updatedMessage?.payload.wall.x2).toBe(200);
      expect(updatedMessage?.payload.wall.door).toBe('standard');
    });

    it('should return error if wall not found', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'wall:update',
        payload: {
          wallId: '00000000-0000-0000-0000-000000000099',
          updates: { x2: 200 },
        },
        timestamp: Date.now(),
      })));

      const lastMessage = getLastSentMessage(mockSocket);
      expect(lastMessage?.type).toBe('error');
      expect(['Wall not found', 'Failed to update wall']).toContain(lastMessage?.payload.message);
    });
  });

  describe('wall:remove handler', () => {
    let wallId: string;

    beforeEach(async () => {
      const [wall] = await app.db
        .insert(walls)
        .values({
          sceneId: testSceneId,
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 100,
        })
        .returning();

      wallId = wall.id;
    });

    it('should delete wall from database and broadcast removal', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'wall:remove',
        payload: { wallId },
        timestamp: Date.now(),
      })));

      // Verify database
      const wallsList = await app.db
        .select()
        .from(walls)
        .where(eq(walls.id, wallId));

      expect(wallsList).toHaveLength(0);

      // Verify broadcast
      const messages = getAllSentMessages(mockSocket);
      const removedMessage = messages.find((m) => m.type === 'wall:removed');

      expect(removedMessage).toBeDefined();
      expect(removedMessage?.payload.wallId).toBe(wallId);
    });

    it('should return error if wall not found', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'wall:remove',
        payload: { wallId: '00000000-0000-0000-0000-000000000099' },
        timestamp: Date.now(),
      })));

      const lastMessage = getLastSentMessage(mockSocket);
      expect(lastMessage?.type).toBe('error');
      expect(['Wall not found', 'Failed to remove wall']).toContain(lastMessage?.payload.message);
    });
  });

  describe('error handling', () => {
    it('should handle invalid JSON gracefully', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from('invalid json'));

      const lastMessage = getLastSentMessage(mockSocket);
      expect(lastMessage?.type).toBe('error');
      expect(lastMessage?.payload.message).toBe('Invalid message format');
    });

    it('should handle unknown message types', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      await messageHandler(Buffer.from(JSON.stringify({
        type: 'unknown:type',
        payload: {},
        timestamp: Date.now(),
      })));

      const lastMessage = getLastSentMessage(mockSocket);
      expect(lastMessage?.type).toBe('error');
      expect(lastMessage?.payload.message).toBe('Unknown message type');
    });

    it('should handle websocket errors', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const errorHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'error'
      )?.[1];

      const testError = new Error('WebSocket error');
      errorHandler(testError);

      expect(mockRequest.log.error).toHaveBeenCalledWith(
        { error: testError },
        'WebSocket error'
      );
    });

    it('should handle dice roll errors with invalid notation', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);
      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      // Join game first
      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      (mockSocket.send as ReturnType<typeof vi.fn>).mockClear();

      // Send invalid dice notation
      await messageHandler(Buffer.from(JSON.stringify({
        type: 'dice:roll',
        payload: { notation: 'invalid-dice-notation', label: 'Test Roll' },
        timestamp: Date.now(),
      })));

      const lastMessage = getLastSentMessage(mockSocket);
      expect(lastMessage?.type).toBe('error');
    });
  });

  describe('connection lifecycle', () => {
    it('should send welcome message on connection', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);

      const lastMessage = getLastSentMessage(mockSocket);
      expect(lastMessage?.type).toBe('campaign:state');
      expect(lastMessage?.payload.clientId).toBe('test-client-id');
    });

    it('should clean up player on disconnect', async () => {
      const mockSocket = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest = {
        id: 'test-client-id',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket, mockRequest);

      const messageHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      // Join game
      await messageHandler(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      // Trigger close event
      const closeHandler = (mockSocket.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'close'
      )?.[1];

      closeHandler();

      // Verify player removed from room
      const { roomManager } = await import('../rooms.js');
      expect(roomManager.getRoomForSocket(mockSocket)).toBeNull();
    });

    it('should notify other players when someone disconnects', async () => {
      // Setup two players
      const mockSocket1 = createMockWebSocket();
      const mockSocket2 = createMockWebSocket();
      const { handleCampaignWebSocket } = await import('./campaign.js');

      const mockRequest1 = {
        id: 'client-1',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket1, mockRequest1);
      const messageHandler1 = (mockSocket1.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler1(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: testSessionId },
        timestamp: Date.now(),
      })));

      // Second player
      const [user2] = await app.db.insert(users).values({
        email: 'test2@example.com',
        username: 'testuser2',
        passwordHash: 'hash',
      }).returning();

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const [session2] = await app.db.insert(sessions).values({
        userId: user2.id,
        expiresAt: futureDate,
      }).returning();

      const mockRequest2 = {
        id: 'client-2',
        log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
        server: app,
      } as any;

      await handleCampaignWebSocket(mockSocket2, mockRequest2);
      const messageHandler2 = (mockSocket2.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      await messageHandler2(Buffer.from(JSON.stringify({
        type: 'campaign:join',
        payload: { campaignId: testCampaignId, token: session2.id },
        timestamp: Date.now(),
      })));

      (mockSocket1.send as ReturnType<typeof vi.fn>).mockClear();

      // Disconnect second player
      const closeHandler2 = (mockSocket2.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0] === 'close'
      )?.[1];

      closeHandler2();

      // Check socket1 received notification
      const messages = getAllSentMessages(mockSocket1);
      const leftMessage = messages.find((m) => m.type === 'campaign:player-left');

      expect(leftMessage).toBeDefined();
      expect(leftMessage?.payload.userId).toBe(user2.id);
    });
  });
});
