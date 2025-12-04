import { describe, it, expect } from 'vitest';
import type {
  Actor,
  CreateActorRequest,
  UpdateActorRequest,
  ActorResponse,
  ActorsListResponse,
} from './actor';

describe('Actor Types', () => {
  describe('Actor', () => {
    it('should have correct structure for basic actor', () => {
      const actor: Actor = {
        id: 'actor123',
        gameId: 'game123',
        name: 'Hero',
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

      expect(actor.id).toBe('actor123');
      expect(actor.gameId).toBe('game123');
      expect(actor.name).toBe('Hero');
      expect(actor.actorType).toBe('character');
    });

    it('should handle actor with image', () => {
      const actor: Actor = {
        id: 'actor1',
        gameId: 'game1',
        name: 'Knight',
        actorType: 'character',
        img: 'https://example.com/knight.png',
        ownerId: 'user123',
        attributes: {},
        abilities: {},
        folderId: null,
        sort: 0,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(actor.img).toBe('https://example.com/knight.png');
      expect(actor.ownerId).toBe('user123');
    });

    it('should handle actor with attributes', () => {
      const actor: Actor = {
        id: 'actor1',
        gameId: 'game1',
        name: 'Warrior',
        actorType: 'character',
        img: null,
        ownerId: null,
        attributes: {
          str: 16,
          dex: 14,
          con: 15,
          int: 10,
          wis: 12,
          cha: 8,
        },
        abilities: {},
        folderId: null,
        sort: 0,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(actor.attributes).toEqual({
        str: 16,
        dex: 14,
        con: 15,
        int: 10,
        wis: 12,
        cha: 8,
      });
    });

    it('should handle actor with abilities', () => {
      const actor: Actor = {
        id: 'actor1',
        gameId: 'game1',
        name: 'Mage',
        actorType: 'character',
        img: null,
        ownerId: null,
        attributes: {},
        abilities: {
          fireball: { level: 3, slots: 4, used: 2 },
          shield: { level: 1, slots: 4, used: 1 },
        },
        folderId: null,
        sort: 0,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(actor.abilities).toHaveProperty('fireball');
      expect(actor.abilities).toHaveProperty('shield');
    });

    it('should handle different actor types', () => {
      const npc: Actor = {
        id: 'actor1',
        gameId: 'game1',
        name: 'Shopkeeper',
        actorType: 'npc',
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

      expect(npc.actorType).toBe('npc');
    });

    it('should handle monster actor type', () => {
      const monster: Actor = {
        id: 'actor1',
        gameId: 'game1',
        name: 'Goblin',
        actorType: 'monster',
        img: null,
        ownerId: null,
        attributes: { hp: 7, ac: 15 },
        abilities: {},
        folderId: null,
        sort: 0,
        data: { cr: 0.25 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(monster.actorType).toBe('monster');
      expect(monster.data).toEqual({ cr: 0.25 });
    });

    it('should handle folder organization', () => {
      const actor: Actor = {
        id: 'actor1',
        gameId: 'game1',
        name: 'Character',
        actorType: 'character',
        img: null,
        ownerId: null,
        attributes: {},
        abilities: {},
        folderId: 'folder123',
        sort: 5,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(actor.folderId).toBe('folder123');
      expect(actor.sort).toBe(5);
    });

    it('should handle custom data', () => {
      const actor: Actor = {
        id: 'actor1',
        gameId: 'game1',
        name: 'Character',
        actorType: 'character',
        img: null,
        ownerId: null,
        attributes: {},
        abilities: {},
        folderId: null,
        sort: 0,
        data: {
          level: 5,
          experience: 6500,
          class: 'Fighter',
          background: 'Soldier',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(actor.data.level).toBe(5);
      expect(actor.data.class).toBe('Fighter');
    });
  });

  describe('CreateActorRequest', () => {
    it('should have correct structure with minimal fields', () => {
      const request: CreateActorRequest = {
        gameId: 'game123',
        name: 'New Character',
        actorType: 'character',
      };

      expect(request.gameId).toBe('game123');
      expect(request.name).toBe('New Character');
      expect(request.actorType).toBe('character');
    });

    it('should handle all optional fields', () => {
      const request: CreateActorRequest = {
        gameId: 'game123',
        name: 'Complete Character',
        actorType: 'character',
        img: 'https://example.com/avatar.png',
        ownerId: 'user123',
        attributes: { str: 10, dex: 10, con: 10 },
        abilities: { attack: { damage: '1d6' } },
        folderId: 'folder123',
        sort: 10,
        data: { notes: 'A brave hero' },
      };

      expect(request.img).toBe('https://example.com/avatar.png');
      expect(request.ownerId).toBe('user123');
      expect(request.attributes).toBeDefined();
      expect(request.folderId).toBe('folder123');
    });

    it('should handle NPC creation', () => {
      const request: CreateActorRequest = {
        gameId: 'game123',
        name: 'Merchant',
        actorType: 'npc',
        data: { shop: 'General Store' },
      };

      expect(request.actorType).toBe('npc');
      expect(request.data).toEqual({ shop: 'General Store' });
    });

    it('should handle monster creation', () => {
      const request: CreateActorRequest = {
        gameId: 'game123',
        name: 'Dragon',
        actorType: 'monster',
        attributes: { hp: 300, ac: 20 },
        data: { cr: 17 },
      };

      expect(request.actorType).toBe('monster');
      expect(request.data).toEqual({ cr: 17 });
    });
  });

  describe('UpdateActorRequest', () => {
    it('should allow updating name only', () => {
      const request: UpdateActorRequest = {
        name: 'Updated Name',
      };

      expect(request.name).toBe('Updated Name');
    });

    it('should allow updating actor type', () => {
      const request: UpdateActorRequest = {
        actorType: 'npc',
      };

      expect(request.actorType).toBe('npc');
    });

    it('should allow updating image', () => {
      const request: UpdateActorRequest = {
        img: 'https://example.com/new-avatar.png',
      };

      expect(request.img).toBe('https://example.com/new-avatar.png');
    });

    it('should allow clearing image', () => {
      const request: UpdateActorRequest = {
        img: null,
      };

      expect(request.img).toBeNull();
    });

    it('should allow updating owner', () => {
      const request: UpdateActorRequest = {
        ownerId: 'newowner123',
      };

      expect(request.ownerId).toBe('newowner123');
    });

    it('should allow updating attributes', () => {
      const request: UpdateActorRequest = {
        attributes: { str: 18, dex: 16 },
      };

      expect(request.attributes).toEqual({ str: 18, dex: 16 });
    });

    it('should allow updating abilities', () => {
      const request: UpdateActorRequest = {
        abilities: { newAbility: { level: 5 } },
      };

      expect(request.abilities).toEqual({ newAbility: { level: 5 } });
    });

    it('should allow updating folder', () => {
      const request: UpdateActorRequest = {
        folderId: 'newfolder123',
      };

      expect(request.folderId).toBe('newfolder123');
    });

    it('should allow updating sort order', () => {
      const request: UpdateActorRequest = {
        sort: 15,
      };

      expect(request.sort).toBe(15);
    });

    it('should allow updating custom data', () => {
      const request: UpdateActorRequest = {
        data: { level: 10, experience: 20000 },
      };

      expect(request.data).toEqual({ level: 10, experience: 20000 });
    });

    it('should allow updating multiple fields', () => {
      const request: UpdateActorRequest = {
        name: 'Updated Character',
        attributes: { hp: 50 },
        sort: 20,
      };

      expect(request.name).toBe('Updated Character');
      expect(request.attributes).toEqual({ hp: 50 });
      expect(request.sort).toBe(20);
    });
  });

  describe('ActorResponse', () => {
    it('should have correct structure', () => {
      const response: ActorResponse = {
        actor: {
          id: 'actor123',
          gameId: 'game123',
          name: 'Hero',
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
        },
      };

      expect(response.actor).toBeDefined();
      expect(response.actor.id).toBe('actor123');
    });
  });

  describe('ActorsListResponse', () => {
    it('should have correct structure with empty array', () => {
      const response: ActorsListResponse = {
        actors: [],
      };

      expect(response.actors).toHaveLength(0);
    });

    it('should have correct structure with multiple actors', () => {
      const response: ActorsListResponse = {
        actors: [
          {
            id: 'actor1',
            gameId: 'game1',
            name: 'Character 1',
            actorType: 'character',
            img: null,
            ownerId: 'user1',
            attributes: {},
            abilities: {},
            folderId: null,
            sort: 0,
            data: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'actor2',
            gameId: 'game1',
            name: 'Goblin',
            actorType: 'monster',
            img: null,
            ownerId: null,
            attributes: { hp: 7 },
            abilities: {},
            folderId: null,
            sort: 1,
            data: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      expect(response.actors).toHaveLength(2);
      expect(response.actors[0].id).toBe('actor1');
      expect(response.actors[1].id).toBe('actor2');
      expect(response.actors[1].actorType).toBe('monster');
    });
  });
});
