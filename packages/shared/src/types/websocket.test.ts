import { describe, it, expect } from 'vitest';
import type {
  WSMessageType,
  WSMessage,
  PlayerInfo,
  CampaignJoinPayload,
  CampaignLeavePayload,
  CampaignPlayersPayload,
  CampaignPlayerJoinedPayload,
  CampaignPlayerLeftPayload,
  TokenMovePayload,
  TokenAddPayload,
  TokenAddedPayload,
  TokenUpdatePayload,
  TokenUpdatedPayload,
  TokenRemovePayload,
  TokenRemovedPayload,
  DiceRollPayload,
  DiceRollGroup,
  DiceResultPayload,
  ChatMessagePayload,
  SceneSwitchPayload,
  SceneSwitchedPayload,
  SceneUpdatePayload,
  SceneUpdatedPayload,
  WallAddPayload,
  WallAddedPayload,
  WallUpdatePayload,
  WallUpdatedPayload,
  WallRemovePayload,
  WallRemovedPayload,
  ErrorPayload,
} from './websocket.js';

describe('WebSocket Types', () => {
  describe('WSMessage', () => {
    it('should have correct structure for ping message', () => {
      const message: WSMessage = {
        type: 'ping',
        payload: {},
        timestamp: Date.now(),
      };

      expect(message.type).toBe('ping');
      expect(message.timestamp).toBeGreaterThan(0);
    });

    it('should have correct structure for pong message', () => {
      const message: WSMessage = {
        type: 'pong',
        payload: {},
        timestamp: Date.now(),
      };

      expect(message.type).toBe('pong');
    });

    it('should handle typed payload', () => {
      const payload: CampaignJoinPayload = {
        campaignId: 'campaign123',
        token: 'token123',
      };

      const message: WSMessage<CampaignJoinPayload> = {
        type: 'campaign:join',
        payload,
        timestamp: Date.now(),
      };

      expect(message.payload.campaignId).toBe('campaign123');
      expect(message.payload.token).toBe('token123');
    });

    it('should handle unknown payload type', () => {
      const message: WSMessage = {
        type: 'error',
        payload: { message: 'Something went wrong' },
        timestamp: Date.now(),
      };

      expect(message.payload).toBeDefined();
    });
  });

  describe('PlayerInfo', () => {
    it('should have correct structure', () => {
      const player: PlayerInfo = {
        userId: 'user123',
        username: 'Player1',
      };

      expect(player.userId).toBe('user123');
      expect(player.username).toBe('Player1');
    });
  });

  describe('Campaign Room Payloads', () => {
    it('should validate CampaignJoinPayload', () => {
      const payload: CampaignJoinPayload = {
        campaignId: 'campaign123',
        token: 'auth-token-xyz',
      };

      expect(payload.campaignId).toBe('campaign123');
      expect(payload.token).toBe('auth-token-xyz');
    });

    it('should validate CampaignLeavePayload', () => {
      const payload: CampaignLeavePayload = {
        campaignId: 'campaign123',
      };

      expect(payload.campaignId).toBe('campaign123');
    });

    it('should validate CampaignPlayersPayload', () => {
      const payload: CampaignPlayersPayload = {
        players: [
          { userId: 'user1', username: 'Player1' },
          { userId: 'user2', username: 'Player2' },
        ],
      };

      expect(payload.players).toHaveLength(2);
      expect(payload.players[0].username).toBe('Player1');
    });

    it('should validate CampaignPlayerJoinedPayload', () => {
      const payload: CampaignPlayerJoinedPayload = {
        player: { userId: 'user3', username: 'Player3' },
      };

      expect(payload.player.userId).toBe('user3');
    });

    it('should validate CampaignPlayerLeftPayload', () => {
      const payload: CampaignPlayerLeftPayload = {
        userId: 'user2',
      };

      expect(payload.userId).toBe('user2');
    });
  });

  describe('Token Payloads', () => {
    it('should validate TokenMovePayload', () => {
      const payload: TokenMovePayload = {
        tokenId: 'token123',
        x: 150,
        y: 200,
      };

      expect(payload.tokenId).toBe('token123');
      expect(payload.x).toBe(150);
      expect(payload.y).toBe(200);
    });

    it('should validate TokenAddPayload with minimal fields', () => {
      const payload: TokenAddPayload = {
        sceneId: 'scene123',
        name: 'Goblin',
        x: 100,
        y: 100,
      };

      expect(payload.sceneId).toBe('scene123');
      expect(payload.name).toBe('Goblin');
      expect(payload.x).toBe(100);
    });

    it('should validate TokenAddPayload with all optional fields', () => {
      const payload: TokenAddPayload = {
        sceneId: 'scene123',
        name: 'Dragon',
        x: 200,
        y: 200,
        width: 3,
        height: 3,
        imageUrl: 'https://example.com/dragon.png',
        visible: true,
        data: { hp: 300 },
        actorId: 'actor123',
        elevation: 10,
        rotation: 45,
        locked: false,
        vision: false,
        visionRange: 0,
        bars: { hp: { value: 300, max: 300 } },
        lightBright: 0,
        lightDim: 0,
        lightColor: null,
        lightAngle: 360,
      };

      expect(payload.width).toBe(3);
      expect(payload.height).toBe(3);
      expect(payload.actorId).toBe('actor123');
    });

    it('should validate TokenAddedPayload', () => {
      const payload: TokenAddedPayload = {
        token: {
          id: 'token123',
          sceneId: 'scene123',
          name: 'Guard',
          x: 50,
          y: 50,
          width: 1,
          height: 1,
          elevation: 0,
          rotation: 0,
          locked: false,
          visible: true,
          vision: false,
          visionRange: 0,
          bars: {},
          lightBright: 0,
          lightDim: 0,
          lightAngle: 360,
          data: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      expect(payload.token.id).toBe('token123');
      expect(payload.token.name).toBe('Guard');
    });

    it('should validate TokenUpdatePayload', () => {
      const payload: TokenUpdatePayload = {
        tokenId: 'token123',
        updates: {
          x: 100,
          y: 150,
          rotation: 90,
        },
      };

      expect(payload.tokenId).toBe('token123');
      expect(payload.updates.x).toBe(100);
      expect(payload.updates.rotation).toBe(90);
    });

    it('should validate TokenUpdatedPayload', () => {
      const payload: TokenUpdatedPayload = {
        token: {
          id: 'token123',
          sceneId: 'scene123',
          name: 'Guard',
          x: 100,
          y: 150,
          width: 1,
          height: 1,
          elevation: 0,
          rotation: 90,
          locked: false,
          visible: true,
          vision: false,
          visionRange: 0,
          bars: {},
          lightBright: 0,
          lightDim: 0,
          lightAngle: 360,
          data: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      expect(payload.token.rotation).toBe(90);
    });

    it('should validate TokenRemovePayload', () => {
      const payload: TokenRemovePayload = {
        tokenId: 'token123',
      };

      expect(payload.tokenId).toBe('token123');
    });

    it('should validate TokenRemovedPayload', () => {
      const payload: TokenRemovedPayload = {
        tokenId: 'token123',
      };

      expect(payload.tokenId).toBe('token123');
    });
  });

  describe('Dice Payloads', () => {
    it('should validate DiceRollPayload without label', () => {
      const payload: DiceRollPayload = {
        notation: '1d20+5',
      };

      expect(payload.notation).toBe('1d20+5');
      expect(payload.label).toBeUndefined();
    });

    it('should validate DiceRollPayload with label', () => {
      const payload: DiceRollPayload = {
        notation: '2d6+3',
        label: 'Attack roll',
      };

      expect(payload.notation).toBe('2d6+3');
      expect(payload.label).toBe('Attack roll');
    });

    it('should validate DiceRollGroup', () => {
      const group: DiceRollGroup = {
        dice: '2d6',
        results: [4, 5],
        subtotal: 9,
      };

      expect(group.dice).toBe('2d6');
      expect(group.results).toEqual([4, 5]);
      expect(group.subtotal).toBe(9);
    });

    it('should validate DiceRollGroup with kept dice', () => {
      const group: DiceRollGroup = {
        dice: '4d6kh3',
        results: [6, 5, 4, 2],
        kept: [0, 1, 2],
        subtotal: 15,
      };

      expect(group.kept).toEqual([0, 1, 2]);
      expect(group.subtotal).toBe(15);
    });

    it('should validate DiceResultPayload', () => {
      const payload: DiceResultPayload = {
        notation: '1d20+5',
        rolls: [
          {
            dice: '1d20',
            results: [15],
            subtotal: 15,
          },
        ],
        modifiers: 5,
        total: 20,
        breakdown: '1d20 (15) + 5 = 20',
        userId: 'user123',
        username: 'Player1',
      };

      expect(payload.total).toBe(20);
      expect(payload.modifiers).toBe(5);
      expect(payload.userId).toBe('user123');
      expect(payload.username).toBe('Player1');
    });

    it('should validate DiceResultPayload with label', () => {
      const payload: DiceResultPayload = {
        notation: '2d6',
        rolls: [
          {
            dice: '2d6',
            results: [3, 4],
            subtotal: 7,
          },
        ],
        modifiers: 0,
        total: 7,
        breakdown: '2d6 (3, 4) = 7',
        label: 'Damage roll',
        userId: 'user123',
        username: 'Player1',
      };

      expect(payload.label).toBe('Damage roll');
    });
  });

  describe('Chat Payloads', () => {
    it('should validate ChatMessagePayload', () => {
      const payload: ChatMessagePayload = {
        text: 'Hello, everyone!',
        userId: 'user123',
        username: 'Player1',
      };

      expect(payload.text).toBe('Hello, everyone!');
      expect(payload.userId).toBe('user123');
      expect(payload.username).toBe('Player1');
    });

    it('should handle empty message', () => {
      const payload: ChatMessagePayload = {
        text: '',
        userId: 'user123',
        username: 'Player1',
      };

      expect(payload.text).toBe('');
    });

    it('should handle long message', () => {
      const longText = 'a'.repeat(1000);
      const payload: ChatMessagePayload = {
        text: longText,
        userId: 'user123',
        username: 'Player1',
      };

      expect(payload.text).toHaveLength(1000);
    });
  });

  describe('Scene Payloads', () => {
    it('should validate SceneSwitchPayload', () => {
      const payload: SceneSwitchPayload = {
        sceneId: 'scene123',
      };

      expect(payload.sceneId).toBe('scene123');
    });

    it('should validate SceneSwitchedPayload', () => {
      const payload: SceneSwitchedPayload = {
        scene: {
          id: 'scene123',
          gameId: 'game123',
          name: 'Battle Map',
          active: true,
          gridType: 'square',
          gridSize: 50,
          gridColor: '#000000',
          gridAlpha: 0.2,
          gridDistance: 5,
          gridUnits: 'ft',
          tokenVision: true,
          fogExploration: true,
          globalLight: false,
          darkness: 0,
          initialScale: 1.0,
          navOrder: 0,
          data: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      expect(payload.scene.id).toBe('scene123');
      expect(payload.scene.name).toBe('Battle Map');
    });

    it('should validate SceneUpdatePayload', () => {
      const payload: SceneUpdatePayload = {
        sceneId: 'scene123',
        updates: {
          name: 'Updated Scene',
          darkness: 0.5,
        },
      };

      expect(payload.sceneId).toBe('scene123');
      expect(payload.updates.name).toBe('Updated Scene');
      expect(payload.updates.darkness).toBe(0.5);
    });

    it('should validate SceneUpdatedPayload', () => {
      const payload: SceneUpdatedPayload = {
        scene: {
          id: 'scene123',
          gameId: 'game123',
          name: 'Updated Scene',
          active: true,
          gridType: 'square',
          gridSize: 50,
          gridColor: '#000000',
          gridAlpha: 0.2,
          gridDistance: 5,
          gridUnits: 'ft',
          tokenVision: true,
          fogExploration: true,
          globalLight: false,
          darkness: 0.5,
          initialScale: 1.0,
          navOrder: 0,
          data: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      expect(payload.scene.darkness).toBe(0.5);
    });
  });

  describe('Wall Payloads', () => {
    it('should validate WallAddPayload with minimal fields', () => {
      const payload: WallAddPayload = {
        sceneId: 'scene123',
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
      };

      expect(payload.sceneId).toBe('scene123');
      expect(payload.x1).toBe(0);
      expect(payload.x2).toBe(100);
    });

    it('should validate WallAddPayload with all optional fields', () => {
      const payload: WallAddPayload = {
        sceneId: 'scene123',
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        wallType: 'normal',
        move: 'block',
        sense: 'block',
        sound: 'block',
        door: 'regular',
        doorState: 'closed',
        data: { hp: 50 },
      };

      expect(payload.door).toBe('regular');
      expect(payload.doorState).toBe('closed');
    });

    it('should validate WallAddedPayload', () => {
      const payload: WallAddedPayload = {
        wall: {
          id: 'wall123',
          sceneId: 'scene123',
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 0,
          wallType: 'normal',
          move: 'block',
          sense: 'block',
          sound: 'block',
          door: 'none',
          doorState: 'closed',
          data: {},
          createdAt: new Date(),
        },
      };

      expect(payload.wall.id).toBe('wall123');
    });

    it('should validate WallUpdatePayload', () => {
      const payload: WallUpdatePayload = {
        wallId: 'wall123',
        updates: {
          doorState: 'open',
          move: 'allow',
        },
      };

      expect(payload.wallId).toBe('wall123');
      expect(payload.updates.doorState).toBe('open');
    });

    it('should validate WallUpdatedPayload', () => {
      const payload: WallUpdatedPayload = {
        wall: {
          id: 'wall123',
          sceneId: 'scene123',
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 0,
          wallType: 'normal',
          move: 'allow',
          sense: 'block',
          sound: 'block',
          door: 'regular',
          doorState: 'open',
          data: {},
          createdAt: new Date(),
        },
      };

      expect(payload.wall.doorState).toBe('open');
    });

    it('should validate WallRemovePayload', () => {
      const payload: WallRemovePayload = {
        wallId: 'wall123',
      };

      expect(payload.wallId).toBe('wall123');
    });

    it('should validate WallRemovedPayload', () => {
      const payload: WallRemovedPayload = {
        wallId: 'wall123',
      };

      expect(payload.wallId).toBe('wall123');
    });
  });

  describe('Error Payload', () => {
    it('should validate ErrorPayload with message only', () => {
      const payload: ErrorPayload = {
        message: 'Something went wrong',
      };

      expect(payload.message).toBe('Something went wrong');
      expect(payload.code).toBeUndefined();
    });

    it('should validate ErrorPayload with code', () => {
      const payload: ErrorPayload = {
        message: 'Unauthorized access',
        code: 'UNAUTHORIZED',
      };

      expect(payload.message).toBe('Unauthorized access');
      expect(payload.code).toBe('UNAUTHORIZED');
    });

    it('should handle various error codes', () => {
      const payload: ErrorPayload = {
        message: 'Not found',
        code: 'NOT_FOUND',
      };

      expect(payload.code).toBe('NOT_FOUND');
    });
  });

  describe('Message Type Validation', () => {
    it('should accept all valid message types', () => {
      const validTypes: WSMessageType[] = [
        'ping',
        'pong',
        'campaign:join',
        'campaign:leave',
        'campaign:state',
        'campaign:players',
        'campaign:player-joined',
        'campaign:player-left',
        'token:move',
        'token:add',
        'token:added',
        'token:update',
        'token:updated',
        'token:remove',
        'token:removed',
        'scene:switch',
        'scene:switched',
        'scene:update',
        'scene:updated',
        'wall:add',
        'wall:added',
        'wall:update',
        'wall:updated',
        'wall:remove',
        'wall:removed',
        'dice:roll',
        'dice:result',
        'chat:message',
        'error',
      ];

      validTypes.forEach((type) => {
        const message: WSMessage = {
          type,
          payload: {},
          timestamp: Date.now(),
        };
        expect(message.type).toBe(type);
      });
    });
  });
});
