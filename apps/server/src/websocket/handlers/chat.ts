import type { FastifyRequest } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type {
  WSMessage,
  ChatMessagePayload,
  ChatDeletePayload,
  ChatDeletedPayload,
  ChatWhisperPayload,
  ChatWhisperMessage,
} from '@vtt/shared';
import { roomManager } from '../rooms.js';
import { chatMessages } from '@vtt/database';
import { eq } from 'drizzle-orm';

/**
 * Handle chat:message event
 * Broadcasts a chat message to all players in the game
 */
export async function handleChatMessage(
  socket: WebSocket,
  message: WSMessage<ChatMessagePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Chat message');

  const gameId = roomManager.getRoomForSocket(socket);
  const playerInfo = roomManager.getPlayerInfo(socket);

  if (!gameId || !playerInfo) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    // Store message in database
    const newMessages = await request.server.db
      .insert(chatMessages)
      .values({
        gameId,
        userId: playerInfo.userId,
        content: message.payload.text,
        messageType: 'chat',
        speaker: {
          userId: playerInfo.userId,
          username: playerInfo.username,
        },
        blind: false,
        data: {},
      })
      .returning();

    const newMessage = newMessages[0];

    // Broadcast to all players with correct user info
    const chatPayload: ChatMessagePayload = {
      text: message.payload.text,
      userId: playerInfo.userId,
      username: playerInfo.username,
    };

    roomManager.broadcast(gameId, {
      type: 'chat:message',
      payload: chatPayload,
      timestamp: Date.now(),
    });

    request.log.info({
      messageId: newMessage.id,
      userId: playerInfo.userId,
      gameId
    }, 'Chat message sent');
  } catch (error) {
    request.log.error({ error }, 'Error sending chat message');
    sendError(socket, 'Failed to send chat message');
  }
}

/**
 * Handle chat:delete event
 * Deletes a chat message and broadcasts to all players
 */
export async function handleChatDelete(
  socket: WebSocket,
  message: WSMessage<ChatDeletePayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Chat delete');

  const gameId = roomManager.getRoomForSocket(socket);

  if (!gameId) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    const { messageId } = message.payload;

    // Delete message from database
    const deletedMessages = await request.server.db
      .delete(chatMessages)
      .where(eq(chatMessages.id, messageId))
      .returning();

    if (deletedMessages.length === 0) {
      sendError(socket, 'Message not found');
      return;
    }

    // Broadcast to all players
    const deletedPayload: ChatDeletedPayload = { messageId };
    roomManager.broadcast(gameId, {
      type: 'chat:deleted',
      payload: deletedPayload,
      timestamp: Date.now(),
    });

    request.log.info({ messageId, gameId }, 'Chat message deleted');
  } catch (error) {
    request.log.error({ error }, 'Error deleting chat message');
    sendError(socket, 'Failed to delete chat message');
  }
}

/**
 * Handle chat:whisper event
 * Sends a private message to specific users only
 */
export async function handleChatWhisper(
  socket: WebSocket,
  message: WSMessage<ChatWhisperPayload>,
  request: FastifyRequest
): Promise<void> {
  request.log.debug({ payload: message.payload }, 'Chat whisper');

  const gameId = roomManager.getRoomForSocket(socket);
  const playerInfo = roomManager.getPlayerInfo(socket);

  if (!gameId || !playerInfo) {
    sendError(socket, 'Not in a game room');
    return;
  }

  try {
    const { text, targetUserIds } = message.payload;

    // Store whisper in database
    const newMessages = await request.server.db
      .insert(chatMessages)
      .values({
        gameId,
        userId: playerInfo.userId,
        content: text,
        messageType: 'whisper',
        speaker: {
          userId: playerInfo.userId,
          username: playerInfo.username,
        },
        whisperTargets: targetUserIds,
        blind: false,
        data: {},
      })
      .returning();

    const newMessage = newMessages[0];

    // Prepare whisper payload
    const whisperMessage: ChatWhisperMessage = {
      text,
      userId: playerInfo.userId,
      username: playerInfo.username,
      targetUserIds,
    };

    const whisperPayload = {
      type: 'chat:whisper' as const,
      payload: whisperMessage,
      timestamp: Date.now(),
    };

    // Get all players in the room
    const players = roomManager.getPlayersInRoom(gameId);

    // Find the sockets for the sender and target users
    const room = (roomManager as any).rooms.get(gameId);
    if (!room) {
      sendError(socket, 'Game room not found');
      return;
    }

    // Send to sender (so they see their own whisper)
    roomManager.sendToSocket(socket, 'chat:whisper', whisperMessage);

    // Send to each target user
    let recipientCount = 0;
    room.forEach((targetSocket: WebSocket) => {
      if (targetSocket === socket) {
        return; // Skip sender, already sent above
      }

      const targetInfo = roomManager.getPlayerInfo(targetSocket);
      if (targetInfo && targetUserIds.includes(targetInfo.userId)) {
        roomManager.sendToSocket(targetSocket, 'chat:whisper', whisperMessage);
        recipientCount++;
      }
    });

    request.log.info({
      messageId: newMessage.id,
      senderId: playerInfo.userId,
      recipientCount,
      gameId
    }, 'Whisper sent');
  } catch (error) {
    request.log.error({ error }, 'Error sending whisper');
    sendError(socket, 'Failed to send whisper');
  }
}

/**
 * Helper function to send error message
 */
function sendError(socket: WebSocket, message: string): void {
  if (socket.readyState === 1) {
    socket.send(JSON.stringify({
      type: 'error',
      payload: { message },
      timestamp: Date.now(),
    }));
  }
}
