import { describe, it, expect } from 'vitest';
import * as shared from './index';

describe('Index Exports', () => {
  describe('Types', () => {
    it('should export User type', () => {
      // Type check - will fail at compile time if not exported
      type TestUser = shared.User;
      const user: TestUser = {
        id: 'user1',
        email: 'test@test.com',
        username: 'test',
        createdAt: new Date(),
      };
      expect(user).toBeDefined();
    });

    it('should export Session type', () => {
      type TestSession = shared.Session;
      const session: TestSession = {
        id: 'session1',
        userId: 'user1',
        expiresAt: new Date(),
      };
      expect(session).toBeDefined();
    });

    it('should export Game type', () => {
      type TestGame = shared.Game;
      const game: TestGame = {
        id: 'game1',
        name: 'Test Game',
        ownerId: 'user1',
        gmUserIds: [],
        createdAt: new Date(),
        settings: { gridType: 'square', gridSize: 50, snapToGrid: true },
      };
      expect(game).toBeDefined();
    });

    it('should export Scene type', () => {
      type TestScene = shared.Scene;
      const scene: TestScene = {
        id: 'scene1',
        gameId: 'game1',
        name: 'Test Scene',
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
      };
      expect(scene).toBeDefined();
    });

    it('should export Token type', () => {
      type TestToken = shared.Token;
      const token: TestToken = {
        id: 'token1',
        sceneId: 'scene1',
        name: 'Token',
        x: 0,
        y: 0,
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
      };
      expect(token).toBeDefined();
    });

    it('should export Wall type', () => {
      type TestWall = shared.Wall;
      const wall: TestWall = {
        id: 'wall1',
        sceneId: 'scene1',
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
      };
      expect(wall).toBeDefined();
    });

    it('should export Actor type', () => {
      type TestActor = shared.Actor;
      const actor: TestActor = {
        id: 'actor1',
        gameId: 'game1',
        name: 'Actor',
        actorType: 'character',
        img: null,
        ownerId: null,
        attributes: {},
        abilities: {},
        folderId: null,
        sort: 0,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(actor).toBeDefined();
    });

    it('should export Item type', () => {
      type TestItem = shared.Item;
      const item: TestItem = {
        id: 'item1',
        gameId: 'game1',
        actorId: null,
        name: 'Item',
        itemType: 'misc',
        img: null,
        description: null,
        quantity: 1,
        weight: 1,
        price: 10,
        equipped: false,
        data: {},
        sort: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(item).toBeDefined();
    });

    it('should export Combat type', () => {
      type TestCombat = shared.Combat;
      const combat: TestCombat = {
        id: 'combat1',
        sceneId: null,
        gameId: 'game1',
        active: false,
        round: 1,
        turn: 0,
        sort: 0,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(combat).toBeDefined();
    });

    it('should export ChatMessage type', () => {
      type TestChatMessage = shared.ChatMessage;
      const message: TestChatMessage = {
        id: 'msg1',
        gameId: 'game1',
        userId: null,
        content: 'Test',
        messageType: 'chat',
        speaker: null,
        rollData: null,
        whisperTargets: null,
        blind: false,
        timestamp: new Date(),
        data: {},
      };
      expect(message).toBeDefined();
    });

    it('should export AmbientLight type', () => {
      type TestAmbientLight = shared.AmbientLight;
      const light: TestAmbientLight = {
        id: 'light1',
        sceneId: 'scene1',
        x: 0,
        y: 0,
        rotation: 0,
        bright: 10,
        dim: 20,
        angle: 360,
        color: '#ffffff',
        alpha: 1.0,
        animationType: null,
        animationSpeed: 1,
        animationIntensity: 5,
        walls: true,
        vision: true,
        data: {},
        createdAt: new Date(),
      };
      expect(light).toBeDefined();
    });

    it('should export WSMessage type', () => {
      type TestWSMessage = shared.WSMessage;
      const message: TestWSMessage = {
        type: 'ping',
        payload: {},
        timestamp: Date.now(),
      };
      expect(message).toBeDefined();
    });
  });

  describe('Utils', () => {
    it('should export generateId function', () => {
      expect(shared.generateId).toBeDefined();
      expect(typeof shared.generateId).toBe('function');

      const id = shared.generateId(10);
      expect(id).toHaveLength(10);
      expect(id).toMatch(/^[a-z0-9]+$/);
    });

    it('should export generateGameId function', () => {
      expect(shared.generateGameId).toBeDefined();
      expect(typeof shared.generateGameId).toBe('function');

      const id = shared.generateGameId();
      expect(id).toHaveLength(8);
      expect(id).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe('Dice Module', () => {
    it('should export dice module', () => {
      expect(shared.dice).toBeDefined();
      expect(typeof shared.dice).toBe('object');
    });

    it('should export parseDiceNotation function', () => {
      expect(shared.dice.parseDiceNotation).toBeDefined();
      expect(typeof shared.dice.parseDiceNotation).toBe('function');

      const result = shared.dice.parseDiceNotation('1d20');
      expect(result).toBeDefined();
      expect(result.notation).toBe('1d20');
      expect(result.rolls).toHaveLength(1);
      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.total).toBeLessThanOrEqual(20);
    });

    it('should export rollDie function', () => {
      expect(shared.dice.rollDie).toBeDefined();
      expect(typeof shared.dice.rollDie).toBe('function');

      const result = shared.dice.rollDie(6);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    });

    it('should export rollDice function', () => {
      expect(shared.dice.rollDice).toBeDefined();
      expect(typeof shared.dice.rollDice).toBe('function');

      const results = shared.dice.rollDice(2, 6);
      expect(results).toHaveLength(2);
      results.forEach((result) => {
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(6);
      });
    });

    it('should export randomInt function', () => {
      expect(shared.dice.randomInt).toBeDefined();
      expect(typeof shared.dice.randomInt).toBe('function');

      const result = shared.dice.randomInt(1, 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    });
  });

  describe('Module Structure', () => {
    it('should have types export', () => {
      // Verify that we can import types
      const keys = Object.keys(shared);
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should export utility functions at root level', () => {
      expect(shared.generateId).toBeDefined();
      expect(shared.generateGameId).toBeDefined();
    });

    it('should export dice module as namespace', () => {
      expect(shared.dice).toBeDefined();
      expect(shared.dice.parseDiceNotation).toBeDefined();
      expect(shared.dice.rollDie).toBeDefined();
      expect(shared.dice.rollDice).toBeDefined();
      expect(shared.dice.randomInt).toBeDefined();
    });
  });

  describe('Export Completeness', () => {
    it('should verify all expected exports are present', () => {
      // Utils
      expect(shared.generateId).toBeDefined();
      expect(shared.generateGameId).toBeDefined();

      // Dice module
      expect(shared.dice).toBeDefined();
      expect(shared.dice.parseDiceNotation).toBeDefined();
      expect(shared.dice.rollDie).toBeDefined();
      expect(shared.dice.rollDice).toBeDefined();
      expect(shared.dice.randomInt).toBeDefined();

      // Types are exported as type-only and can't be checked at runtime,
      // but the import statement itself validates their existence
    });
  });
});
