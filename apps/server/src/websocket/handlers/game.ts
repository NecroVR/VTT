import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type {
  WSMessage,
  WSMessageType,
  Token,
  TokenMovePayload,
  TokenAddPayload,
  TokenAddedPayload,
  TokenUpdatePayload,
  TokenUpdatedPayload,
  TokenRemovePayload,
  TokenRemovedPayload,
  DiceRollPayload,
  DiceResultPayload,
  GameJoinPayload,
  GameLeavePayload,
  GamePlayersPayload,
  GamePlayerJoinedPayload,
  GamePlayerLeftPayload,
  ChatMessagePayload,
  ErrorPayload
} from '@vtt/shared';
import { roomManager } from '../rooms';
import { validateSession, extractSessionToken } from '../auth';
import { tokens } from '@vtt/database';
import { eq } from 'drizzle-orm';

/**
 * Game session WebSocket handler
 * Manages real-time communication for game sessions
 */
export async function handleGameWebSocket(
  connection: WebSocket,
  request: FastifyRequest
) {
  const socket = connection;
  const clientId = request.id;

  request.log.info(`WebSocket client connected: ${clientId}`);

  // Handle incoming messages
  socket.on('message', async (rawMessage: Buffer) => {
    try {
      const message = JSON.parse(rawMessage.toString()) as WSMessage;

      request.log.debug({ message }, 'Received WebSocket message');

      // Handle different message types
      switch (message.type) {
        case 'ping':
          handlePing(socket);
          break;

        case 'game:join':
          await handleGameJoin(socket, message as WSMessage<GameJoinPayload>, request);
          break;

        case 'game:leave':
          handleGameLeave(socket, message as WSMessage<GameLeavePayload>, request);
          break;

        case 'token:move':
          await handleTokenMove(socket, message as WSMessage<TokenMovePayload>, request);
          break;

        case 'token:add':
          await handleTokenAdd(socket, message as WSMessage<TokenAddPayload>, request);
          break;

        case 'token:remove':
          await handleTokenRemove(socket, message as WSMessage<TokenRemovePayload>, request);
          break;

        case 'dice:roll':
          handleDiceRoll(socket, message as WSMessage<DiceRollPayload>, request);
          break;

        case 'chat:message':
          handleChatMessage(socket, message as WSMessage<ChatMessagePayload>, request);
          break;

        default:
          request.log.warn({ type: message.type }, 'Unknown message type');
          sendMessage(socket, 'error', { message: 'Unknown message type' });
      }
    } catch (error) {
      request.log.error({ error }, 'Error processing WebSocket message');
      sendMessage(socket, 'error', { message: 'Invalid message format' });
    }
  });

  // Handle connection close
  socket.on('close', () => {
    request.log.info(`WebSocket client disconnected: ${clientId}`);

    // Clean up: remove player from their room
    const gameId = roomManager.getRoomForSocket(socket);
    if (gameId) {
      const playerInfo = roomManager.getPlayerInfo(socket);
      roomManager.leave(socket);

      // Notify other players
      if (playerInfo) {
        const payload: GamePlayerLeftPayload = { userId: playerInfo.userId };
        roomManager.broadcast(gameId, {
          type: 'game:player-left',
          payload,
          timestamp: Date.now(),
        });
      }
    }
  });

  // Handle errors
  socket.on('error', (error: Error) => {
    request.log.error({ error }, 'WebSocket error');
  });

  // Send welcome message
  sendMessage(socket, 'game:state', { clientId });
}

/**
 * Helper function to send type-safe WebSocket messages
 */
function sendMessage<T>(
  socket: WebSocket,
  type: WSMessageType,
  payload: T
): void {
  const message: WSMessage<T> = {
    type,
    payload,
    timestamp: Date.now(),
  };
  socket.send(JSON.stringify(message));
}

/**
 * Handle ping message - respond with pong
 */
function handlePing(socket: WebSocket): void {
  sendMessage(socket, 'pong', {});
}

/**
 * Handle game join request
 */
async function handleGameJoin(
  socket: WebSocket,
  message: WSMessage<GameJoinPayload>,
  request: FastifyRequest
): Promise<void> {
  const { gameId, token } = message.payload;

  request.log.info({ gameId }, 'Client joining game session');

  // Validate session token
  const user = await validateSession(request.server, token);

  if (!user) {
    const errorPayload: ErrorPayload = {
      message: 'Invalid or expired session',
      code: 'UNAUTHORIZED',
    };
    sendMessage(socket, 'error', errorPayload);
    return;
  }

  // Add player to room
  roomManager.join(gameId, socket, {
    userId: user.userId,
    username: user.username,
  });

  // Get current players in room
  const players = roomManager.getPlayersInRoom(gameId);

  // Send player list to the joining player
  const playersPayload: GamePlayersPayload = { players };
  sendMessage(socket, 'game:players', playersPayload);

  // Notify other players that someone joined
  const joinedPayload: GamePlayerJoinedPayload = {
    player: {
      userId: user.userId,
      username: user.username,
    },
  };

  roomManager.broadcast(
    gameId,
    {
      type: 'game:player-joined',
      payload: joinedPayload,
      timestamp: Date.now(),
    },
    socket // Exclude the joining player
  );

  request.log.info({
    gameId,
    userId: user.userId,
    playerCount: players.length,
  }, 'Player joined game session');
}

/**
 * Handle game leave request
 */
function handleGameLeave(
  socket: WebSocket,
  message: WSMessage<GameLeavePayload>,
  request: FastifyRequest
): void {
  const { gameId } = message.payload;

  request.log.info({ gameId }, 'Client leaving game session');

  // Get player info before removing
  const playerInfo = roomManager.getPlayerInfo(socket);

  // Remove player from room
  roomManager.leave(socket);

  // Notify other players
  if (playerInfo) {
    const payload: GamePlayerLeftPayload = { userId: playerInfo.userId };
    roomManager.broadcast(gameId, {
      type: 'game:player-left',
      payload,
      timestamp: Date.now(),
    });

    request.log.info({
      gameId,
      userId: playerInfo.userId,
    }, 'Player left game session');
  }
}

/**
 * Handle token move action
 */
async function handleTokenMove(
  socket: WebSocket,
  message: WSMessage<TokenMovePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Token move');

  const { tokenId, x, y } = message.payload;

  // Get the game room for this socket
  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendMessage(socket, 'error', { message: 'Not in a game room' });
    return;
  }

  try {
    // Update token position in database
    const updatedTokens = await request.server.db
      .update(tokens)
      .set({ x, y })
      .where(eq(tokens.id, tokenId))
      .returning();

    if (updatedTokens.length === 0) {
      sendMessage(socket, 'error', { message: 'Token not found' });
      return;
    }

    // Broadcast to all players in the game (including sender for confirmation)
    roomManager.broadcast(gameId, {
      type: 'token:move',
      payload: { tokenId, x, y },
      timestamp: Date.now(),
    });
  } catch (error) {
    request.log.error({ error, tokenId }, 'Error updating token position');
    sendMessage(socket, 'error', { message: 'Failed to update token position' });
  }
}

/**
 * Handle token add action
 */
async function handleTokenAdd(
  socket: WebSocket,
  message: WSMessage<TokenAddPayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Token add');

  const gameId = roomManager.getRoomForSocket(socket);
  const playerInfo = roomManager.getPlayerInfo(socket);

  if (!gameId || !playerInfo) {
    sendMessage(socket, 'error', { message: 'Not in a game room' });
    return;
  }

  try {
    const {
      name,
      x,
      y,
      width = 1,
      height = 1,
      imageUrl = null,
      visible = true,
      data = {}
    } = message.payload;

    // Create token in database
    const newTokens = await request.server.db
      .insert(tokens)
      .values({
        gameId,
        name,
        x,
        y,
        width,
        height,
        imageUrl,
        visible,
        data,
        ownerId: playerInfo.userId
      })
      .returning();

    const newToken = newTokens[0];

    // Convert token to match Token interface
    const tokenPayload: Token = {
      id: newToken.id,
      gameId: newToken.gameId,
      name: newToken.name,
      imageUrl: newToken.imageUrl,
      x: newToken.x,
      y: newToken.y,
      width: newToken.width,
      height: newToken.height,
      ownerId: newToken.ownerId,
      visible: newToken.visible,
      data: newToken.data as Record<string, unknown>,
      createdAt: newToken.createdAt.toISOString()
    };

    // Broadcast to all players with full token including ID
    const addedPayload: TokenAddedPayload = { token: tokenPayload };
    roomManager.broadcast(gameId, {
      type: 'token:added',
      payload: addedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ tokenId: newToken.id, gameId }, 'Token created');
  } catch (error) {
    request.log.error({ error }, 'Error creating token');
    sendMessage(socket, 'error', { message: 'Failed to create token' });
  }
}

/**
 * Handle token remove action
 */
async function handleTokenRemove(
  socket: WebSocket,
  message: WSMessage<TokenRemovePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Token remove');

  const { tokenId } = message.payload;

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendMessage(socket, 'error', { message: 'Not in a game room' });
    return;
  }

  try {
    // Delete token from database
    const deletedTokens = await request.server.db
      .delete(tokens)
      .where(eq(tokens.id, tokenId))
      .returning();

    if (deletedTokens.length === 0) {
      sendMessage(socket, 'error', { message: 'Token not found' });
      return;
    }

    // Broadcast to all players
    const removedPayload: TokenRemovedPayload = { tokenId };
    roomManager.broadcast(gameId, {
      type: 'token:removed',
      payload: removedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ tokenId, gameId }, 'Token removed');
  } catch (error) {
    request.log.error({ error, tokenId }, 'Error removing token');
    sendMessage(socket, 'error', { message: 'Failed to remove token' });
  }
}

/**
 * Handle dice roll request
 */
function handleDiceRoll(
  socket: WebSocket,
  message: WSMessage<DiceRollPayload>,
  request: FastifyRequest
): void {
  request.log.debug({ payload: message.payload }, 'Dice roll');

  const { notation, label } = message.payload;

  const gameId = roomManager.getRoomForSocket(socket);
  const playerInfo = roomManager.getPlayerInfo(socket);

  if (!gameId || !playerInfo) {
    sendMessage(socket, 'error', { message: 'Not in a game room' });
    return;
  }

  // TODO: Implement actual dice rolling logic
  // For now, send a mock result
  const mockResult: DiceResultPayload = {
    notation,
    rolls: [4, 3, 6], // Mock rolls
    total: 13,
    label,
    userId: playerInfo.userId,
  };

  // Broadcast dice result to all players
  roomManager.broadcast(gameId, {
    type: 'dice:result',
    payload: mockResult,
    timestamp: Date.now(),
  });
}

/**
 * Handle chat message
 */
function handleChatMessage(
  socket: WebSocket,
  message: WSMessage<ChatMessagePayload>,
  request: FastifyRequest
): void {
  request.log.debug({ payload: message.payload }, 'Chat message');

  const gameId = roomManager.getRoomForSocket(socket);
  const playerInfo = roomManager.getPlayerInfo(socket);

  if (!gameId || !playerInfo) {
    sendMessage(socket, 'error', { message: 'Not in a game room' });
    return;
  }

  // Ensure the message has the correct user info
  const chatPayload: ChatMessagePayload = {
    text: message.payload.text,
    userId: playerInfo.userId,
    username: playerInfo.username,
  };

  // Broadcast to all players
  roomManager.broadcast(gameId, {
    type: 'chat:message',
    payload: chatPayload,
    timestamp: Date.now(),
  });
}
