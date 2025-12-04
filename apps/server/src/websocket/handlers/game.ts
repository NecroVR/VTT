import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type {
  WSMessage,
  WSMessageType,
  TokenMovePayload,
  DiceRollPayload,
  DiceResultPayload,
  GameJoinPayload,
  GameLeavePayload,
  GamePlayersPayload,
  GamePlayerJoinedPayload,
  GamePlayerLeftPayload,
  ChatMessagePayload,
  ErrorPayload,
  TokenAddPayload,
  TokenRemovePayload
} from '@vtt/shared';
import { roomManager } from '../rooms';
import { validateSession, extractSessionToken } from '../auth';

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
  socket.on('message', (rawMessage: Buffer) => {
    try {
      const message = JSON.parse(rawMessage.toString()) as WSMessage;

      request.log.debug({ message }, 'Received WebSocket message');

      // Handle different message types
      switch (message.type) {
        case 'ping':
          handlePing(socket);
          break;

        case 'game:join':
          handleGameJoin(socket, message as WSMessage<GameJoinPayload>, request);
          break;

        case 'game:leave':
          handleGameLeave(socket, message as WSMessage<GameLeavePayload>, request);
          break;

        case 'token:move':
          handleTokenMove(socket, message as WSMessage<TokenMovePayload>, request);
          break;

        case 'token:add':
          handleTokenAdd(socket, message as WSMessage<TokenAddPayload>, request);
          break;

        case 'token:remove':
          handleTokenRemove(socket, message as WSMessage<TokenRemovePayload>, request);
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
function handleTokenMove(
  socket: WebSocket,
  message: WSMessage<TokenMovePayload>,
  request: FastifyRequest
): void {
  request.log.debug({ payload: message.payload }, 'Token move');

  const { tokenId, x, y } = message.payload;

  // Get the game room for this socket
  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendMessage(socket, 'error', { message: 'Not in a game room' });
    return;
  }

  // TODO: Validate token ownership and update database

  // Broadcast to all players in the game (including sender for confirmation)
  roomManager.broadcast(gameId, {
    type: 'token:move',
    payload: { tokenId, x, y },
    timestamp: Date.now(),
  });
}

/**
 * Handle token add action
 */
function handleTokenAdd(
  socket: WebSocket,
  message: WSMessage<TokenAddPayload>,
  request: FastifyRequest
): void {
  request.log.debug({ payload: message.payload }, 'Token add');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendMessage(socket, 'error', { message: 'Not in a game room' });
    return;
  }

  // TODO: Implement token creation logic and save to database

  // Broadcast to all players
  roomManager.broadcast(gameId, {
    type: 'token:add',
    payload: message.payload,
    timestamp: Date.now(),
  });
}

/**
 * Handle token remove action
 */
function handleTokenRemove(
  socket: WebSocket,
  message: WSMessage<TokenRemovePayload>,
  request: FastifyRequest
): void {
  request.log.debug({ payload: message.payload }, 'Token remove');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendMessage(socket, 'error', { message: 'Not in a game room' });
    return;
  }

  // TODO: Implement token removal logic and update database

  // Broadcast to all players
  roomManager.broadcast(gameId, {
    type: 'token:remove',
    payload: message.payload,
    timestamp: Date.now(),
  });
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
