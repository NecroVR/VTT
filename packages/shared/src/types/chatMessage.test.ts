import { describe, it, expect } from 'vitest';
import type {
  ChatMessage,
  CreateChatMessageRequest,
  ChatMessageResponse,
  ChatMessagesListResponse,
} from './chatMessage.js';

describe('ChatMessage Types', () => {
  describe('ChatMessage', () => {
    it('should have correct structure for basic chat message', () => {
      const message: ChatMessage = {
        id: 'msg123',
        campaignId: 'game123',
        userId: null,
        content: 'Hello everyone!',
        messageType: 'chat',
        speaker: null,
        rollData: null,
        whisperTargets: null,
        blind: false,
        timestamp: new Date(),
        data: {},
      };

      expect(message.id).toBe('msg123');
      expect(message.campaignId).toBe('game123');
      expect(message.content).toBe('Hello everyone!');
      expect(message.messageType).toBe('chat');
    });

    it('should handle message with user', () => {
      const message: ChatMessage = {
        id: 'msg1',
        campaignId: 'game1',
        userId: 'user123',
        content: 'I attack!',
        messageType: 'ic',
        speaker: null,
        rollData: null,
        whisperTargets: null,
        blind: false,
        timestamp: new Date(),
        data: {},
      };

      expect(message.userId).toBe('user123');
      expect(message.messageType).toBe('ic');
    });

    it('should handle message with speaker info', () => {
      const message: ChatMessage = {
        id: 'msg1',
        campaignId: 'game1',
        userId: 'user1',
        content: 'Greetings!',
        messageType: 'ic',
        speaker: { name: 'Hero', actorId: 'actor123', tokenId: 'token123' },
        rollData: null,
        whisperTargets: null,
        blind: false,
        timestamp: new Date(),
        data: {},
      };

      expect(message.speaker).toBeDefined();
      expect(message.speaker?.name).toBe('Hero');
    });

    it('should handle roll message type', () => {
      const message: ChatMessage = {
        id: 'msg1',
        campaignId: 'game1',
        userId: 'user1',
        content: 'Rolling attack',
        messageType: 'roll',
        speaker: null,
        rollData: {
          formula: '1d20+5',
          total: 18,
          rolls: [{ result: 13, dice: '1d20' }],
        },
        whisperTargets: null,
        blind: false,
        timestamp: new Date(),
        data: {},
      };

      expect(message.messageType).toBe('roll');
      expect(message.rollData).toBeDefined();
      expect(message.rollData?.total).toBe(18);
    });

    it('should handle whisper message', () => {
      const message: ChatMessage = {
        id: 'msg1',
        campaignId: 'game1',
        userId: 'user1',
        content: 'Secret message',
        messageType: 'whisper',
        speaker: null,
        rollData: null,
        whisperTargets: { users: ['user2', 'user3'] },
        blind: false,
        timestamp: new Date(),
        data: {},
      };

      expect(message.messageType).toBe('whisper');
      expect(message.whisperTargets).toBeDefined();
    });

    it('should handle blind message', () => {
      const message: ChatMessage = {
        id: 'msg1',
        campaignId: 'game1',
        userId: 'user1',
        content: 'GM only',
        messageType: 'gm',
        speaker: null,
        rollData: null,
        whisperTargets: null,
        blind: true,
        timestamp: new Date(),
        data: {},
      };

      expect(message.blind).toBe(true);
      expect(message.messageType).toBe('gm');
    });

    it('should handle different message types', () => {
      const types = ['chat', 'ic', 'ooc', 'emote', 'whisper', 'roll', 'gm'];

      types.forEach((type) => {
        const message: ChatMessage = {
          id: 'msg1',
          campaignId: 'game1',
          userId: null,
          content: 'Test',
          messageType: type,
          speaker: null,
          rollData: null,
          whisperTargets: null,
          blind: false,
          timestamp: new Date(),
          data: {},
        };

        expect(message.messageType).toBe(type);
      });
    });

    it('should handle empty content', () => {
      const message: ChatMessage = {
        id: 'msg1',
        campaignId: 'game1',
        userId: null,
        content: '',
        messageType: 'chat',
        speaker: null,
        rollData: null,
        whisperTargets: null,
        blind: false,
        timestamp: new Date(),
        data: {},
      };

      expect(message.content).toBe('');
    });

    it('should handle long content', () => {
      const longContent = 'a'.repeat(1000);
      const message: ChatMessage = {
        id: 'msg1',
        campaignId: 'game1',
        userId: null,
        content: longContent,
        messageType: 'chat',
        speaker: null,
        rollData: null,
        whisperTargets: null,
        blind: false,
        timestamp: new Date(),
        data: {},
      };

      expect(message.content).toHaveLength(1000);
    });

    it('should handle custom data', () => {
      const message: ChatMessage = {
        id: 'msg1',
        campaignId: 'game1',
        userId: null,
        content: 'Test',
        messageType: 'chat',
        speaker: null,
        rollData: null,
        whisperTargets: null,
        blind: false,
        timestamp: new Date(),
        data: { flavor: 'With dramatic flair!', sound: 'sword_swing.mp3' },
      };

      expect(message.data.flavor).toBe('With dramatic flair!');
      expect(message.data.sound).toBe('sword_swing.mp3');
    });

    it('should handle timestamp', () => {
      const now = new Date();
      const message: ChatMessage = {
        id: 'msg1',
        campaignId: 'game1',
        userId: null,
        content: 'Test',
        messageType: 'chat',
        speaker: null,
        rollData: null,
        whisperTargets: null,
        blind: false,
        timestamp: now,
        data: {},
      };

      expect(message.timestamp).toBe(now);
      expect(message.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('CreateChatMessageRequest', () => {
    it('should have correct structure with minimal fields', () => {
      const request: CreateChatMessageRequest = {
        campaignId: 'game123',
        content: 'Hello!',
      };

      expect(request.campaignId).toBe('game123');
      expect(request.content).toBe('Hello!');
    });

    it('should handle all optional fields', () => {
      const request: CreateChatMessageRequest = {
        campaignId: 'game123',
        userId: 'user123',
        content: 'I cast fireball!',
        messageType: 'ic',
        speaker: { name: 'Wizard', actorId: 'actor123' },
        rollData: { formula: '8d6', total: 32 },
        whisperTargets: { users: ['user2'] },
        blind: false,
        data: { spell: 'fireball', level: 3 },
      };

      expect(request.userId).toBe('user123');
      expect(request.messageType).toBe('ic');
      expect(request.speaker).toBeDefined();
      expect(request.rollData).toBeDefined();
      expect(request.whisperTargets).toBeDefined();
    });

    it('should handle null user', () => {
      const request: CreateChatMessageRequest = {
        campaignId: 'game123',
        userId: null,
        content: 'System message',
      };

      expect(request.userId).toBeNull();
    });

    it('should handle chat message', () => {
      const request: CreateChatMessageRequest = {
        campaignId: 'game123',
        content: 'Hello everyone!',
        messageType: 'chat',
      };

      expect(request.messageType).toBe('chat');
    });

    it('should handle IC message', () => {
      const request: CreateChatMessageRequest = {
        campaignId: 'game123',
        userId: 'user1',
        content: 'I search for traps',
        messageType: 'ic',
        speaker: { name: 'Rogue', actorId: 'actor1' },
      };

      expect(request.messageType).toBe('ic');
      expect(request.speaker?.name).toBe('Rogue');
    });

    it('should handle OOC message', () => {
      const request: CreateChatMessageRequest = {
        campaignId: 'game123',
        userId: 'user1',
        content: 'BRB, getting snacks',
        messageType: 'ooc',
      };

      expect(request.messageType).toBe('ooc');
    });

    it('should handle emote message', () => {
      const request: CreateChatMessageRequest = {
        campaignId: 'game123',
        userId: 'user1',
        content: 'draws sword dramatically',
        messageType: 'emote',
      };

      expect(request.messageType).toBe('emote');
    });

    it('should handle roll message with data', () => {
      const request: CreateChatMessageRequest = {
        campaignId: 'game123',
        userId: 'user1',
        content: 'Attack roll',
        messageType: 'roll',
        rollData: {
          formula: '1d20+5',
          total: 18,
          rolls: [{ result: 13 }],
        },
      };

      expect(request.messageType).toBe('roll');
      expect(request.rollData?.total).toBe(18);
    });

    it('should handle whisper with targets', () => {
      const request: CreateChatMessageRequest = {
        campaignId: 'game123',
        userId: 'user1',
        content: 'Secret plan',
        messageType: 'whisper',
        whisperTargets: { users: ['user2', 'user3'] },
      };

      expect(request.whisperTargets?.users).toContain('user2');
      expect(request.whisperTargets?.users).toContain('user3');
    });

    it('should handle blind message', () => {
      const request: CreateChatMessageRequest = {
        campaignId: 'game123',
        userId: 'user1',
        content: 'Hidden roll',
        messageType: 'roll',
        blind: true,
      };

      expect(request.blind).toBe(true);
    });
  });

  describe('ChatMessageResponse', () => {
    it('should have correct structure', () => {
      const response: ChatMessageResponse = {
        chatMessage: {
          id: 'msg123',
          campaignId: 'game123',
          userId: null,
          content: 'Test',
          messageType: 'chat',
          speaker: null,
          rollData: null,
          whisperTargets: null,
          blind: false,
          timestamp: new Date(),
          data: {},
        },
      };

      expect(response.chatMessage).toBeDefined();
      expect(response.chatMessage.id).toBe('msg123');
    });
  });

  describe('ChatMessagesListResponse', () => {
    it('should have correct structure with empty array', () => {
      const response: ChatMessagesListResponse = {
        chatMessages: [],
      };

      expect(response.chatMessages).toHaveLength(0);
    });

    it('should have correct structure with multiple messages', () => {
      const response: ChatMessagesListResponse = {
        chatMessages: [
          {
            id: 'msg1',
            campaignId: 'game1',
            userId: 'user1',
            content: 'Hello!',
            messageType: 'chat',
            speaker: null,
            rollData: null,
            whisperTargets: null,
            blind: false,
            timestamp: new Date(),
            data: {},
          },
          {
            id: 'msg2',
            campaignId: 'game1',
            userId: 'user2',
            content: 'Hi there!',
            messageType: 'chat',
            speaker: null,
            rollData: null,
            whisperTargets: null,
            blind: false,
            timestamp: new Date(),
            data: {},
          },
        ],
      };

      expect(response.chatMessages).toHaveLength(2);
      expect(response.chatMessages[0].id).toBe('msg1');
      expect(response.chatMessages[1].id).toBe('msg2');
      expect(response.chatMessages[0].content).toBe('Hello!');
      expect(response.chatMessages[1].content).toBe('Hi there!');
    });

    it('should handle mixed message types', () => {
      const response: ChatMessagesListResponse = {
        chatMessages: [
          {
            id: 'msg1',
            campaignId: 'game1',
            userId: 'user1',
            content: 'Chat message',
            messageType: 'chat',
            speaker: null,
            rollData: null,
            whisperTargets: null,
            blind: false,
            timestamp: new Date(),
            data: {},
          },
          {
            id: 'msg2',
            campaignId: 'game1',
            userId: 'user1',
            content: 'Roll result',
            messageType: 'roll',
            speaker: null,
            rollData: { total: 15 },
            whisperTargets: null,
            blind: false,
            timestamp: new Date(),
            data: {},
          },
          {
            id: 'msg3',
            campaignId: 'game1',
            userId: 'user2',
            content: 'Whisper',
            messageType: 'whisper',
            speaker: null,
            rollData: null,
            whisperTargets: { users: ['user1'] },
            blind: false,
            timestamp: new Date(),
            data: {},
          },
        ],
      };

      expect(response.chatMessages).toHaveLength(3);
      expect(response.chatMessages[0].messageType).toBe('chat');
      expect(response.chatMessages[1].messageType).toBe('roll');
      expect(response.chatMessages[2].messageType).toBe('whisper');
    });
  });
});
