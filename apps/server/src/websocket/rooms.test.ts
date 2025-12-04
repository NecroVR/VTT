import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoomManager } from './rooms.js';
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

describe('RoomManager', () => {
  let roomManager: RoomManager;

  beforeEach(() => {
    // Create fresh instance for each test
    roomManager = new RoomManager();
  });

  describe('join', () => {
    it('should add player to a new room', () => {
      const socket = createMockWebSocket();
      const userInfo = { userId: 'user1', username: 'Player1' };

      roomManager.join('game1', socket, userInfo);

      expect(roomManager.getRoomForSocket(socket)).toBe('game1');
      expect(roomManager.getPlayerInfo(socket)).toEqual(userInfo);
      expect(roomManager.getRoomSize('game1')).toBe(1);
    });

    it('should add multiple players to the same room', () => {
      const socket1 = createMockWebSocket();
      const socket2 = createMockWebSocket();
      const userInfo1 = { userId: 'user1', username: 'Player1' };
      const userInfo2 = { userId: 'user2', username: 'Player2' };

      roomManager.join('game1', socket1, userInfo1);
      roomManager.join('game1', socket2, userInfo2);

      expect(roomManager.getRoomSize('game1')).toBe(2);
      expect(roomManager.getPlayersInRoom('game1')).toHaveLength(2);
    });

    it('should remove player from previous room when joining new room', () => {
      const socket = createMockWebSocket();
      const userInfo = { userId: 'user1', username: 'Player1' };

      roomManager.join('game1', socket, userInfo);
      expect(roomManager.getRoomSize('game1')).toBe(1);

      roomManager.join('game2', socket, userInfo);
      expect(roomManager.getRoomSize('game1')).toBe(0);
      expect(roomManager.getRoomSize('game2')).toBe(1);
      expect(roomManager.getRoomForSocket(socket)).toBe('game2');
    });

    it('should update player info when joining same room again', () => {
      const socket = createMockWebSocket();
      const userInfo1 = { userId: 'user1', username: 'Player1' };
      const userInfo2 = { userId: 'user1', username: 'UpdatedPlayer1' };

      roomManager.join('game1', socket, userInfo1);
      roomManager.join('game1', socket, userInfo2);

      expect(roomManager.getPlayerInfo(socket)).toEqual(userInfo2);
      expect(roomManager.getRoomSize('game1')).toBe(1);
    });
  });

  describe('leave', () => {
    it('should remove player from their current room', () => {
      const socket = createMockWebSocket();
      const userInfo = { userId: 'user1', username: 'Player1' };

      roomManager.join('game1', socket, userInfo);
      roomManager.leave(socket);

      expect(roomManager.getRoomForSocket(socket)).toBeNull();
      expect(roomManager.getPlayerInfo(socket)).toBeNull();
      expect(roomManager.getRoomSize('game1')).toBe(0);
    });

    it('should clean up empty rooms', () => {
      const socket = createMockWebSocket();
      const userInfo = { userId: 'user1', username: 'Player1' };

      roomManager.join('game1', socket, userInfo);
      roomManager.leave(socket);

      // Room should be removed entirely
      expect(roomManager.getRoomSize('game1')).toBe(0);
    });

    it('should not affect other players in the same room', () => {
      const socket1 = createMockWebSocket();
      const socket2 = createMockWebSocket();
      const userInfo1 = { userId: 'user1', username: 'Player1' };
      const userInfo2 = { userId: 'user2', username: 'Player2' };

      roomManager.join('game1', socket1, userInfo1);
      roomManager.join('game1', socket2, userInfo2);

      roomManager.leave(socket1);

      expect(roomManager.getRoomSize('game1')).toBe(1);
      expect(roomManager.getPlayerInfo(socket2)).toEqual(userInfo2);
    });

    it('should handle leaving when not in any room', () => {
      const socket = createMockWebSocket();

      // Should not throw
      expect(() => roomManager.leave(socket)).not.toThrow();
    });
  });

  describe('broadcast', () => {
    it('should send message to all players in room', () => {
      const socket1 = createMockWebSocket();
      const socket2 = createMockWebSocket();
      const socket3 = createMockWebSocket();

      roomManager.join('game1', socket1, { userId: 'user1', username: 'Player1' });
      roomManager.join('game1', socket2, { userId: 'user2', username: 'Player2' });
      roomManager.join('game1', socket3, { userId: 'user3', username: 'Player3' });

      const message: WSMessage<{ test: string }> = {
        type: 'chat:message',
        payload: { test: 'data' },
        timestamp: Date.now(),
      };

      roomManager.broadcast('game1', message);

      expect(socket1.send).toHaveBeenCalledWith(JSON.stringify(message));
      expect(socket2.send).toHaveBeenCalledWith(JSON.stringify(message));
      expect(socket3.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should exclude specified socket from broadcast', () => {
      const socket1 = createMockWebSocket();
      const socket2 = createMockWebSocket();
      const socket3 = createMockWebSocket();

      roomManager.join('game1', socket1, { userId: 'user1', username: 'Player1' });
      roomManager.join('game1', socket2, { userId: 'user2', username: 'Player2' });
      roomManager.join('game1', socket3, { userId: 'user3', username: 'Player3' });

      const message: WSMessage<{ test: string }> = {
        type: 'chat:message',
        payload: { test: 'data' },
        timestamp: Date.now(),
      };

      roomManager.broadcast('game1', message, socket2);

      expect(socket1.send).toHaveBeenCalledWith(JSON.stringify(message));
      expect(socket2.send).not.toHaveBeenCalled();
      expect(socket3.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should not send to sockets with non-open readyState', () => {
      const socket1 = createMockWebSocket(1); // OPEN
      const socket2 = createMockWebSocket(0); // CONNECTING
      const socket3 = createMockWebSocket(2); // CLOSING

      roomManager.join('game1', socket1, { userId: 'user1', username: 'Player1' });
      roomManager.join('game1', socket2, { userId: 'user2', username: 'Player2' });
      roomManager.join('game1', socket3, { userId: 'user3', username: 'Player3' });

      const message: WSMessage<{ test: string }> = {
        type: 'chat:message',
        payload: { test: 'data' },
        timestamp: Date.now(),
      };

      roomManager.broadcast('game1', message);

      expect(socket1.send).toHaveBeenCalledWith(JSON.stringify(message));
      expect(socket2.send).not.toHaveBeenCalled();
      expect(socket3.send).not.toHaveBeenCalled();
    });

    it('should handle broadcast to non-existent room', () => {
      const message: WSMessage<{ test: string }> = {
        type: 'chat:message',
        payload: { test: 'data' },
        timestamp: Date.now(),
      };

      // Should not throw
      expect(() => roomManager.broadcast('non-existent-room', message)).not.toThrow();
    });

    it('should handle send errors gracefully', () => {
      const socket1 = createMockWebSocket();
      const socket2 = createMockWebSocket();

      // Mock console.error to suppress error output
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock socket1 to throw error
      socket1.send = vi.fn(() => {
        throw new Error('Send failed');
      });

      roomManager.join('game1', socket1, { userId: 'user1', username: 'Player1' });
      roomManager.join('game1', socket2, { userId: 'user2', username: 'Player2' });

      const message: WSMessage<{ test: string }> = {
        type: 'chat:message',
        payload: { test: 'data' },
        timestamp: Date.now(),
      };

      // Should not throw, should continue to socket2
      expect(() => roomManager.broadcast('game1', message)).not.toThrow();
      expect(socket2.send).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error broadcasting message:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('sendToSocket', () => {
    it('should send message to specific socket', () => {
      const socket = createMockWebSocket();

      roomManager.sendToSocket(socket, 'game:state', { clientId: 'test' });

      expect(socket.send).toHaveBeenCalledTimes(1);
      const sentMessage = JSON.parse((socket.send as ReturnType<typeof vi.fn>).mock.calls[0][0]);
      expect(sentMessage.type).toBe('game:state');
      expect(sentMessage.payload).toEqual({ clientId: 'test' });
      expect(sentMessage.timestamp).toBeDefined();
    });

    it('should not send if socket is not open', () => {
      const socket = createMockWebSocket(0); // CONNECTING

      roomManager.sendToSocket(socket, 'game:state', { clientId: 'test' });

      expect(socket.send).not.toHaveBeenCalled();
    });

    it('should handle send errors gracefully', () => {
      const socket = createMockWebSocket();

      // Mock console.error to suppress error output
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      socket.send = vi.fn(() => {
        throw new Error('Send failed');
      });

      // Should not throw
      expect(() => {
        roomManager.sendToSocket(socket, 'error', { message: 'test' });
      }).not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending message:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getPlayersInRoom', () => {
    it('should return list of players in room', () => {
      const socket1 = createMockWebSocket();
      const socket2 = createMockWebSocket();
      const userInfo1 = { userId: 'user1', username: 'Player1' };
      const userInfo2 = { userId: 'user2', username: 'Player2' };

      roomManager.join('game1', socket1, userInfo1);
      roomManager.join('game1', socket2, userInfo2);

      const players = roomManager.getPlayersInRoom('game1');

      expect(players).toHaveLength(2);
      expect(players).toContainEqual(userInfo1);
      expect(players).toContainEqual(userInfo2);
    });

    it('should return empty array for non-existent room', () => {
      const players = roomManager.getPlayersInRoom('non-existent');
      expect(players).toEqual([]);
    });

    it('should return empty array for empty room', () => {
      const socket = createMockWebSocket();
      roomManager.join('game1', socket, { userId: 'user1', username: 'Player1' });
      roomManager.leave(socket);

      const players = roomManager.getPlayersInRoom('game1');
      expect(players).toEqual([]);
    });
  });

  describe('getRoomForSocket', () => {
    it('should return room ID for socket in room', () => {
      const socket = createMockWebSocket();
      roomManager.join('game1', socket, { userId: 'user1', username: 'Player1' });

      expect(roomManager.getRoomForSocket(socket)).toBe('game1');
    });

    it('should return null for socket not in any room', () => {
      const socket = createMockWebSocket();
      expect(roomManager.getRoomForSocket(socket)).toBeNull();
    });
  });

  describe('getPlayerInfo', () => {
    it('should return player info for socket', () => {
      const socket = createMockWebSocket();
      const userInfo = { userId: 'user1', username: 'Player1' };

      roomManager.join('game1', socket, userInfo);

      expect(roomManager.getPlayerInfo(socket)).toEqual(userInfo);
    });

    it('should return null for socket not in any room', () => {
      const socket = createMockWebSocket();
      expect(roomManager.getPlayerInfo(socket)).toBeNull();
    });
  });

  describe('getRoomSize', () => {
    it('should return correct size for room with players', () => {
      const socket1 = createMockWebSocket();
      const socket2 = createMockWebSocket();

      roomManager.join('game1', socket1, { userId: 'user1', username: 'Player1' });
      roomManager.join('game1', socket2, { userId: 'user2', username: 'Player2' });

      expect(roomManager.getRoomSize('game1')).toBe(2);
    });

    it('should return 0 for non-existent room', () => {
      expect(roomManager.getRoomSize('non-existent')).toBe(0);
    });

    it('should return 0 for empty room', () => {
      const socket = createMockWebSocket();
      roomManager.join('game1', socket, { userId: 'user1', username: 'Player1' });
      roomManager.leave(socket);

      expect(roomManager.getRoomSize('game1')).toBe(0);
    });
  });

  describe('isInRoom', () => {
    it('should return true if socket is in specified room', () => {
      const socket = createMockWebSocket();
      roomManager.join('game1', socket, { userId: 'user1', username: 'Player1' });

      expect(roomManager.isInRoom(socket, 'game1')).toBe(true);
    });

    it('should return false if socket is in different room', () => {
      const socket = createMockWebSocket();
      roomManager.join('game1', socket, { userId: 'user1', username: 'Player1' });

      expect(roomManager.isInRoom(socket, 'game2')).toBe(false);
    });

    it('should return false if socket is not in any room', () => {
      const socket = createMockWebSocket();
      expect(roomManager.isInRoom(socket, 'game1')).toBe(false);
    });
  });
});
