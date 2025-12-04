import type { WebSocket } from '@fastify/websocket';
import type { WSMessage, WSMessageType } from '@vtt/shared';

/**
 * Player information in a game room
 */
export interface PlayerInfo {
  userId: string;
  username: string;
  socket: WebSocket;
}

/**
 * Room Manager
 * Manages game rooms and player connections for WebSocket multiplayer
 */
export class RoomManager {
  // Map of gameId -> Set of WebSocket connections
  private rooms: Map<string, Set<WebSocket>> = new Map();

  // Map of WebSocket -> gameId
  private playerRooms: Map<WebSocket, string> = new Map();

  // Map of WebSocket -> player info
  private playerInfo: Map<WebSocket, { userId: string; username: string }> = new Map();

  /**
   * Add a player to a game room
   * @param gameId - The ID of the game to join
   * @param socket - The player's WebSocket connection
   * @param userInfo - The player's user information
   */
  join(gameId: string, socket: WebSocket, userInfo: { userId: string; username: string }): void {
    // Remove player from any existing room
    this.leave(socket);

    // Get or create room
    if (!this.rooms.has(gameId)) {
      this.rooms.set(gameId, new Set());
    }

    // Add player to room
    const room = this.rooms.get(gameId)!;
    room.add(socket);

    // Track player's room and info
    this.playerRooms.set(socket, gameId);
    this.playerInfo.set(socket, userInfo);
  }

  /**
   * Remove a player from their current room
   * @param socket - The player's WebSocket connection
   */
  leave(socket: WebSocket): void {
    const gameId = this.playerRooms.get(socket);

    if (gameId) {
      const room = this.rooms.get(gameId);
      if (room) {
        room.delete(socket);

        // Clean up empty rooms
        if (room.size === 0) {
          this.rooms.delete(gameId);
        }
      }

      this.playerRooms.delete(socket);
    }

    this.playerInfo.delete(socket);
  }

  /**
   * Broadcast a message to all players in a room
   * @param gameId - The game room to broadcast to
   * @param message - The message to send
   * @param excludeSocket - Optional socket to exclude from broadcast
   */
  broadcast<T>(
    gameId: string,
    message: WSMessage<T>,
    excludeSocket?: WebSocket
  ): void {
    const room = this.rooms.get(gameId);

    if (!room) {
      return;
    }

    const messageStr = JSON.stringify(message);

    room.forEach((socket) => {
      if (socket !== excludeSocket && socket.readyState === 1) { // 1 = OPEN
        try {
          socket.send(messageStr);
        } catch (error) {
          console.error('Error broadcasting message:', error);
        }
      }
    });
  }

  /**
   * Send a message to a specific socket
   * @param socket - The target WebSocket connection
   * @param type - Message type
   * @param payload - Message payload
   */
  sendToSocket<T>(socket: WebSocket, type: WSMessageType, payload: T): void {
    if (socket.readyState === 1) { // 1 = OPEN
      const message: WSMessage<T> = {
        type,
        payload,
        timestamp: Date.now(),
      };

      try {
        socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }

  /**
   * Get list of players in a room
   * @param gameId - The game room ID
   * @returns Array of player information
   */
  getPlayersInRoom(gameId: string): Array<{ userId: string; username: string }> {
    const room = this.rooms.get(gameId);

    if (!room) {
      return [];
    }

    const players: Array<{ userId: string; username: string }> = [];

    room.forEach((socket) => {
      const info = this.playerInfo.get(socket);
      if (info) {
        players.push({
          userId: info.userId,
          username: info.username,
        });
      }
    });

    return players;
  }

  /**
   * Get the room ID for a socket
   * @param socket - The WebSocket connection
   * @returns The room ID or null
   */
  getRoomForSocket(socket: WebSocket): string | null {
    return this.playerRooms.get(socket) || null;
  }

  /**
   * Get player info for a socket
   * @param socket - The WebSocket connection
   * @returns Player info or null
   */
  getPlayerInfo(socket: WebSocket): { userId: string; username: string } | null {
    return this.playerInfo.get(socket) || null;
  }

  /**
   * Get the number of players in a room
   * @param gameId - The game room ID
   * @returns Number of players
   */
  getRoomSize(gameId: string): number {
    const room = this.rooms.get(gameId);
    return room ? room.size : 0;
  }

  /**
   * Check if a socket is in a room
   * @param socket - The WebSocket connection
   * @param gameId - The game room ID
   * @returns True if socket is in room
   */
  isInRoom(socket: WebSocket, gameId: string): boolean {
    return this.playerRooms.get(socket) === gameId;
  }
}

// Export singleton instance
export const roomManager = new RoomManager();
