import type { FastifyPluginAsync } from 'fastify';
import { chatMessages, games, users } from '@vtt/database';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { ChatMessage, CreateChatMessageRequest } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';

/**
 * Chat Messages API routes
 * All routes require authentication
 * Handles chat message operations for games
 */
const chatRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/v1/games/:gameId/chat - Get chat history for a game
   * Returns paginated chat messages with optional filtering
   * Query params: limit (default 50), offset (default 0), type (optional)
   */
  fastify.get<{
    Params: { gameId: string };
    Querystring: { limit?: string; offset?: string; type?: string };
  }>(
    '/games/:gameId/chat',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { gameId } = request.params;
      const { limit = '50', offset = '0', type } = request.query;

      // Parse and validate pagination params
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
      const offsetNum = Math.max(parseInt(offset, 10) || 0, 0);

      try {
        // Verify game exists and user has access to it
        const [game] = await fastify.db
          .select()
          .from(games)
          .where(eq(games.id, gameId))
          .limit(1);

        if (!game) {
          return reply.status(404).send({ error: 'Game not found' });
        }

        // TODO: Check if user is a participant in the game

        // Build query conditions
        let conditions = eq(chatMessages.gameId, gameId);

        // Add type filter if specified
        if (type) {
          conditions = and(conditions, eq(chatMessages.messageType, type)) as any;
        }

        // Fetch chat messages with user information
        const messages = await fastify.db
          .select({
            id: chatMessages.id,
            gameId: chatMessages.gameId,
            userId: chatMessages.userId,
            content: chatMessages.content,
            messageType: chatMessages.messageType,
            speaker: chatMessages.speaker,
            rollData: chatMessages.rollData,
            whisperTargets: chatMessages.whisperTargets,
            blind: chatMessages.blind,
            timestamp: chatMessages.timestamp,
            data: chatMessages.data,
            // Include user information
            username: users.username,
          })
          .from(chatMessages)
          .leftJoin(users, eq(chatMessages.userId, users.id))
          .where(conditions)
          .orderBy(desc(chatMessages.timestamp))
          .limit(limitNum)
          .offset(offsetNum);

        // Filter whisper messages based on user permissions
        const filteredMessages = messages.filter((msg) => {
          // If message is not a whisper or blind, show it
          if (!msg.whisperTargets && !msg.blind) {
            return true;
          }

          // Show message to the sender
          if (msg.userId === request.user?.id) {
            return true;
          }

          // TODO: Check if user is GM (game owner)
          // For now, game owner sees all messages
          if (game.ownerId === request.user?.id) {
            return true;
          }

          // Check if user is in whisper targets
          if (msg.whisperTargets) {
            const targets = msg.whisperTargets as { userIds?: string[] };
            if (targets.userIds?.includes(request.user?.id || '')) {
              return true;
            }
          }

          // Hide blind rolls from players
          if (msg.blind) {
            return false;
          }

          return false;
        });

        // Format messages
        const formattedMessages: ChatMessage[] = filteredMessages.map((msg) => ({
          id: msg.id,
          gameId: msg.gameId,
          userId: msg.userId,
          content: msg.content,
          messageType: msg.messageType,
          speaker: msg.speaker as Record<string, unknown> | null,
          rollData: msg.rollData as Record<string, unknown> | null,
          whisperTargets: msg.whisperTargets as Record<string, unknown> | null,
          blind: msg.blind,
          timestamp: msg.timestamp,
          data: msg.data as Record<string, unknown>,
        }));

        return reply.status(200).send({
          chatMessages: formattedMessages,
          pagination: {
            limit: limitNum,
            offset: offsetNum,
            total: formattedMessages.length,
          }
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch chat messages');
        return reply.status(500).send({ error: 'Failed to fetch chat messages' });
      }
    }
  );

  /**
   * POST /api/v1/games/:gameId/chat - Send a chat message
   * Creates a new chat message for a game (REST fallback, WebSocket preferred)
   */
  fastify.post<{
    Params: { gameId: string };
    Body: CreateChatMessageRequest;
  }>(
    '/games/:gameId/chat',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { gameId } = request.params;
      const messageData = request.body;

      // Validate required fields
      if (!messageData.content || messageData.content.trim() === '') {
        return reply.status(400).send({ error: 'Message content is required' });
      }

      try {
        // Verify game exists and user has access to it
        const [game] = await fastify.db
          .select()
          .from(games)
          .where(eq(games.id, gameId))
          .limit(1);

        if (!game) {
          return reply.status(404).send({ error: 'Game not found' });
        }

        // TODO: Check if user is a participant in the game

        // Create chat message in database
        const newMessages = await fastify.db
          .insert(chatMessages)
          .values({
            gameId,
            userId: request.user.id,
            content: messageData.content.trim(),
            messageType: messageData.messageType || 'chat',
            speaker: messageData.speaker ?? null,
            rollData: messageData.rollData ?? null,
            whisperTargets: messageData.whisperTargets ?? null,
            blind: messageData.blind ?? false,
            data: messageData.data ?? {},
          })
          .returning();

        const newMessage = newMessages[0];

        // Convert to ChatMessage interface
        const formattedMessage: ChatMessage = {
          id: newMessage.id,
          gameId: newMessage.gameId,
          userId: newMessage.userId,
          content: newMessage.content,
          messageType: newMessage.messageType,
          speaker: newMessage.speaker as Record<string, unknown> | null,
          rollData: newMessage.rollData as Record<string, unknown> | null,
          whisperTargets: newMessage.whisperTargets as Record<string, unknown> | null,
          blind: newMessage.blind,
          timestamp: newMessage.timestamp,
          data: newMessage.data as Record<string, unknown>,
        };

        // TODO: Broadcast message via WebSocket to game room

        return reply.status(201).send({ chatMessage: formattedMessage });
      } catch (error) {
        fastify.log.error(error, 'Failed to create chat message');
        return reply.status(500).send({ error: 'Failed to create chat message' });
      }
    }
  );

  /**
   * DELETE /api/v1/chat/:messageId - Delete a chat message
   * Users can delete their own messages, GMs can delete any message
   */
  fastify.delete<{ Params: { messageId: string } }>(
    '/chat/:messageId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { messageId } = request.params;

      try {
        // Fetch the message with game information
        const [message] = await fastify.db
          .select({
            message: chatMessages,
            gameOwnerId: games.ownerId,
          })
          .from(chatMessages)
          .leftJoin(games, eq(chatMessages.gameId, games.id))
          .where(eq(chatMessages.id, messageId))
          .limit(1);

        if (!message || !message.message) {
          return reply.status(404).send({ error: 'Chat message not found' });
        }

        // Check authorization: user owns the message OR user is the game owner (GM)
        const isOwner = message.message.userId === request.user.id;
        const isGM = message.gameOwnerId === request.user.id;

        if (!isOwner && !isGM) {
          return reply.status(403).send({
            error: 'Forbidden: You can only delete your own messages unless you are the GM'
          });
        }

        // Delete the message
        await fastify.db
          .delete(chatMessages)
          .where(eq(chatMessages.id, messageId));

        // TODO: Broadcast deletion via WebSocket to game room

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete chat message');
        return reply.status(500).send({ error: 'Failed to delete chat message' });
      }
    }
  );
};

export default chatRoute;
