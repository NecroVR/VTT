import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type {
  WSMessage,
  WSMessageType,
  TokenMovePayload,
  DiceRollPayload,
  DiceResultPayload
} from '@vtt/shared';

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
          handleGameJoin(socket, message, request);
          break;

        case 'game:leave':
          handleGameLeave(socket, message, request);
          break;

        case 'token:move':
          handleTokenMove(socket, message as WSMessage<TokenMovePayload>, request);
          break;

        case 'token:add':
          handleTokenAdd(socket, message, request);
          break;

        case 'token:remove':
          handleTokenRemove(socket, message, request);
          break;

        case 'dice:roll':
          handleDiceRoll(socket, message as WSMessage<DiceRollPayload>, request);
          break;

        case 'chat:message':
          handleChatMessage(socket, message, request);
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
function handleGameJoin(
  socket: WebSocket,
  message: WSMessage,
  request: FastifyRequest
): void {
  request.log.info({ message }, 'Client joining game session');

  // TODO: Implement game session join logic
  // Expected payload: { gameId: string, userId: string }
  sendMessage(socket, 'game:state', {
    message: 'Joined game session',
    // TODO: Include full game state
  });
}

/**
 * Handle game leave request
 */
function handleGameLeave(
  socket: WebSocket,
  message: WSMessage,
  request: FastifyRequest
): void {
  request.log.info({ message }, 'Client leaving game session');

  // TODO: Implement game session leave logic
  sendMessage(socket, 'game:state', {
    message: 'Left game session'
  });
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

  // TODO: Validate token ownership and update database
  // TODO: Broadcast to other players in the game

  // Echo back the move for now
  sendMessage(socket, 'token:move', { tokenId, x, y });
}

/**
 * Handle token add action
 */
function handleTokenAdd(
  socket: WebSocket,
  message: WSMessage,
  request: FastifyRequest
): void {
  request.log.debug({ payload: message.payload }, 'Token add');

  // TODO: Implement token creation logic
  // Expected payload: Token data
  sendMessage(socket, 'token:add', message.payload);
}

/**
 * Handle token remove action
 */
function handleTokenRemove(
  socket: WebSocket,
  message: WSMessage,
  request: FastifyRequest
): void {
  request.log.debug({ payload: message.payload }, 'Token remove');

  // TODO: Implement token removal logic
  // Expected payload: { tokenId: string }
  sendMessage(socket, 'token:remove', message.payload);
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

  // TODO: Implement actual dice rolling logic
  // For now, send a mock result
  const mockResult: DiceResultPayload = {
    notation,
    rolls: [4, 3, 6], // Mock rolls
    total: 13,
    label,
    userId: 'mock-user-id', // TODO: Get from session
  };

  sendMessage(socket, 'dice:result', mockResult);
}

/**
 * Handle chat message
 */
function handleChatMessage(
  socket: WebSocket,
  message: WSMessage,
  request: FastifyRequest
): void {
  request.log.debug({ payload: message.payload }, 'Chat message');

  // TODO: Implement chat message broadcasting
  // Expected payload: { text: string, userId: string }
  sendMessage(socket, 'chat:message', message.payload);
}
