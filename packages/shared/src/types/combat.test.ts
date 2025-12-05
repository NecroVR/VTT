import { describe, it, expect } from 'vitest';
import type {
  Combat,
  Combatant,
  CreateCombatRequest,
  UpdateCombatRequest,
  CreateCombatantRequest,
  UpdateCombatantRequest,
  CombatResponse,
  CombatsListResponse,
  CombatantResponse,
  CombatantsListResponse,
} from './combat.js';

describe('Combat Types', () => {
  describe('Combat', () => {
    it('should have correct structure for basic combat', () => {
      const combat: Combat = {
        id: 'combat123',
        sceneId: null,
        campaignId: 'game123',
        active: false,
        round: 1,
        turn: 0,
        sort: 0,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(combat.id).toBe('combat123');
      expect(combat.campaignId).toBe('game123');
      expect(combat.active).toBe(false);
      expect(combat.round).toBe(1);
      expect(combat.turn).toBe(0);
    });

    it('should handle combat with scene reference', () => {
      const combat: Combat = {
        id: 'combat1',
        sceneId: 'scene123',
        campaignId: 'game123',
        active: true,
        round: 3,
        turn: 2,
        sort: 0,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(combat.sceneId).toBe('scene123');
      expect(combat.active).toBe(true);
    });

    it('should handle active combat state', () => {
      const combat: Combat = {
        id: 'combat1',
        sceneId: 'scene1',
        campaignId: 'game1',
        active: true,
        round: 1,
        turn: 0,
        sort: 0,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(combat.active).toBe(true);
    });

    it('should handle round progression', () => {
      const combat: Combat = {
        id: 'combat1',
        sceneId: 'scene1',
        campaignId: 'game1',
        active: true,
        round: 5,
        turn: 3,
        sort: 0,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(combat.round).toBe(5);
      expect(combat.turn).toBe(3);
    });

    it('should handle sort order', () => {
      const combat: Combat = {
        id: 'combat1',
        sceneId: null,
        campaignId: 'game1',
        active: false,
        round: 1,
        turn: 0,
        sort: 5,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(combat.sort).toBe(5);
    });

    it('should handle custom data', () => {
      const combat: Combat = {
        id: 'combat1',
        sceneId: null,
        campaignId: 'game1',
        active: false,
        round: 1,
        turn: 0,
        sort: 0,
        data: { encounterName: 'Goblin Ambush', difficulty: 'medium' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(combat.data.encounterName).toBe('Goblin Ambush');
      expect(combat.data.difficulty).toBe('medium');
    });
  });

  describe('Combatant', () => {
    it('should have correct structure for basic combatant', () => {
      const combatant: Combatant = {
        id: 'combatant123',
        combatId: 'combat123',
        actorId: null,
        tokenId: null,
        initiative: null,
        initiativeModifier: 0,
        hidden: false,
        defeated: false,
        data: {},
        createdAt: new Date(),
      };

      expect(combatant.id).toBe('combatant123');
      expect(combatant.combatId).toBe('combat123');
      expect(combatant.initiative).toBeNull();
      expect(combatant.hidden).toBe(false);
      expect(combatant.defeated).toBe(false);
    });

    it('should handle combatant with actor reference', () => {
      const combatant: Combatant = {
        id: 'combatant1',
        combatId: 'combat1',
        actorId: 'actor123',
        tokenId: null,
        initiative: 15,
        initiativeModifier: 2,
        hidden: false,
        defeated: false,
        data: {},
        createdAt: new Date(),
      };

      expect(combatant.actorId).toBe('actor123');
      expect(combatant.initiative).toBe(15);
      expect(combatant.initiativeModifier).toBe(2);
    });

    it('should handle combatant with token reference', () => {
      const combatant: Combatant = {
        id: 'combatant1',
        combatId: 'combat1',
        actorId: 'actor123',
        tokenId: 'token123',
        initiative: 18,
        initiativeModifier: 3,
        hidden: false,
        defeated: false,
        data: {},
        createdAt: new Date(),
      };

      expect(combatant.tokenId).toBe('token123');
    });

    it('should handle combatant with no initiative rolled', () => {
      const combatant: Combatant = {
        id: 'combatant1',
        combatId: 'combat1',
        actorId: 'actor1',
        tokenId: null,
        initiative: null,
        initiativeModifier: 1,
        hidden: false,
        defeated: false,
        data: {},
        createdAt: new Date(),
      };

      expect(combatant.initiative).toBeNull();
    });

    it('should handle hidden combatant', () => {
      const combatant: Combatant = {
        id: 'combatant1',
        combatId: 'combat1',
        actorId: 'actor1',
        tokenId: null,
        initiative: 20,
        initiativeModifier: 4,
        hidden: true,
        defeated: false,
        data: {},
        createdAt: new Date(),
      };

      expect(combatant.hidden).toBe(true);
    });

    it('should handle defeated combatant', () => {
      const combatant: Combatant = {
        id: 'combatant1',
        combatId: 'combat1',
        actorId: 'actor1',
        tokenId: null,
        initiative: 12,
        initiativeModifier: 1,
        hidden: false,
        defeated: true,
        data: {},
        createdAt: new Date(),
      };

      expect(combatant.defeated).toBe(true);
    });

    it('should handle negative initiative modifier', () => {
      const combatant: Combatant = {
        id: 'combatant1',
        combatId: 'combat1',
        actorId: 'actor1',
        tokenId: null,
        initiative: 8,
        initiativeModifier: -1,
        hidden: false,
        defeated: false,
        data: {},
        createdAt: new Date(),
      };

      expect(combatant.initiativeModifier).toBe(-1);
    });

    it('should handle custom data', () => {
      const combatant: Combatant = {
        id: 'combatant1',
        combatId: 'combat1',
        actorId: 'actor1',
        tokenId: null,
        initiative: 15,
        initiativeModifier: 2,
        hidden: false,
        defeated: false,
        data: { conditions: ['poisoned'], temporaryHP: 5 },
        createdAt: new Date(),
      };

      expect(combatant.data.conditions).toEqual(['poisoned']);
      expect(combatant.data.temporaryHP).toBe(5);
    });
  });

  describe('CreateCombatRequest', () => {
    it('should have correct structure with minimal fields', () => {
      const request: CreateCombatRequest = {
        campaignId: 'game123',
      };

      expect(request.campaignId).toBe('game123');
    });

    it('should handle all optional fields', () => {
      const request: CreateCombatRequest = {
        campaignId: 'game123',
        sceneId: 'scene123',
        active: true,
        round: 1,
        turn: 0,
        sort: 5,
        data: { type: 'random encounter' },
      };

      expect(request.sceneId).toBe('scene123');
      expect(request.active).toBe(true);
      expect(request.round).toBe(1);
      expect(request.sort).toBe(5);
    });

    it('should handle null scene', () => {
      const request: CreateCombatRequest = {
        campaignId: 'game123',
        sceneId: null,
      };

      expect(request.sceneId).toBeNull();
    });
  });

  describe('UpdateCombatRequest', () => {
    it('should allow updating active state', () => {
      const request: UpdateCombatRequest = {
        active: true,
      };

      expect(request.active).toBe(true);
    });

    it('should allow updating scene', () => {
      const request: UpdateCombatRequest = {
        sceneId: 'newscene123',
      };

      expect(request.sceneId).toBe('newscene123');
    });

    it('should allow clearing scene', () => {
      const request: UpdateCombatRequest = {
        sceneId: null,
      };

      expect(request.sceneId).toBeNull();
    });

    it('should allow updating round', () => {
      const request: UpdateCombatRequest = {
        round: 3,
      };

      expect(request.round).toBe(3);
    });

    it('should allow updating turn', () => {
      const request: UpdateCombatRequest = {
        turn: 2,
      };

      expect(request.turn).toBe(2);
    });

    it('should allow updating sort order', () => {
      const request: UpdateCombatRequest = {
        sort: 10,
      };

      expect(request.sort).toBe(10);
    });

    it('should allow updating custom data', () => {
      const request: UpdateCombatRequest = {
        data: { notes: 'Combat notes' },
      };

      expect(request.data).toEqual({ notes: 'Combat notes' });
    });

    it('should allow updating multiple fields', () => {
      const request: UpdateCombatRequest = {
        active: false,
        round: 10,
        turn: 5,
      };

      expect(request.active).toBe(false);
      expect(request.round).toBe(10);
      expect(request.turn).toBe(5);
    });
  });

  describe('CreateCombatantRequest', () => {
    it('should have correct structure with minimal fields', () => {
      const request: CreateCombatantRequest = {
        combatId: 'combat123',
      };

      expect(request.combatId).toBe('combat123');
    });

    it('should handle all optional fields', () => {
      const request: CreateCombatantRequest = {
        combatId: 'combat123',
        actorId: 'actor123',
        tokenId: 'token123',
        initiative: 18,
        initiativeModifier: 3,
        hidden: false,
        defeated: false,
        data: { hp: 50 },
      };

      expect(request.actorId).toBe('actor123');
      expect(request.tokenId).toBe('token123');
      expect(request.initiative).toBe(18);
      expect(request.initiativeModifier).toBe(3);
    });

    it('should handle null references', () => {
      const request: CreateCombatantRequest = {
        combatId: 'combat123',
        actorId: null,
        tokenId: null,
        initiative: null,
      };

      expect(request.actorId).toBeNull();
      expect(request.tokenId).toBeNull();
      expect(request.initiative).toBeNull();
    });
  });

  describe('UpdateCombatantRequest', () => {
    it('should allow updating actor reference', () => {
      const request: UpdateCombatantRequest = {
        actorId: 'newactor123',
      };

      expect(request.actorId).toBe('newactor123');
    });

    it('should allow updating token reference', () => {
      const request: UpdateCombatantRequest = {
        tokenId: 'newtoken123',
      };

      expect(request.tokenId).toBe('newtoken123');
    });

    it('should allow updating initiative', () => {
      const request: UpdateCombatantRequest = {
        initiative: 20,
      };

      expect(request.initiative).toBe(20);
    });

    it('should allow updating initiative modifier', () => {
      const request: UpdateCombatantRequest = {
        initiativeModifier: 5,
      };

      expect(request.initiativeModifier).toBe(5);
    });

    it('should allow updating hidden state', () => {
      const request: UpdateCombatantRequest = {
        hidden: true,
      };

      expect(request.hidden).toBe(true);
    });

    it('should allow updating defeated state', () => {
      const request: UpdateCombatantRequest = {
        defeated: true,
      };

      expect(request.defeated).toBe(true);
    });

    it('should allow updating custom data', () => {
      const request: UpdateCombatantRequest = {
        data: { currentHP: 25, maxHP: 50 },
      };

      expect(request.data).toEqual({ currentHP: 25, maxHP: 50 });
    });

    it('should allow updating multiple fields', () => {
      const request: UpdateCombatantRequest = {
        initiative: 15,
        hidden: false,
        defeated: true,
      };

      expect(request.initiative).toBe(15);
      expect(request.hidden).toBe(false);
      expect(request.defeated).toBe(true);
    });
  });

  describe('CombatResponse', () => {
    it('should have correct structure', () => {
      const response: CombatResponse = {
        combat: {
          id: 'combat123',
          sceneId: null,
          campaignId: 'game123',
          active: false,
          round: 1,
          turn: 0,
          sort: 0,
          data: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      expect(response.combat).toBeDefined();
      expect(response.combat.id).toBe('combat123');
    });
  });

  describe('CombatsListResponse', () => {
    it('should have correct structure with empty array', () => {
      const response: CombatsListResponse = {
        combats: [],
      };

      expect(response.combats).toHaveLength(0);
    });

    it('should have correct structure with multiple combats', () => {
      const response: CombatsListResponse = {
        combats: [
          {
            id: 'combat1',
            sceneId: 'scene1',
            campaignId: 'game1',
            active: true,
            round: 2,
            turn: 1,
            sort: 0,
            data: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'combat2',
            sceneId: null,
            campaignId: 'game1',
            active: false,
            round: 1,
            turn: 0,
            sort: 1,
            data: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      expect(response.combats).toHaveLength(2);
      expect(response.combats[0].id).toBe('combat1');
      expect(response.combats[1].id).toBe('combat2');
      expect(response.combats[0].active).toBe(true);
      expect(response.combats[1].active).toBe(false);
    });
  });

  describe('CombatantResponse', () => {
    it('should have correct structure', () => {
      const response: CombatantResponse = {
        combatant: {
          id: 'combatant123',
          combatId: 'combat123',
          actorId: null,
          tokenId: null,
          initiative: null,
          initiativeModifier: 0,
          hidden: false,
          defeated: false,
          data: {},
          createdAt: new Date(),
        },
      };

      expect(response.combatant).toBeDefined();
      expect(response.combatant.id).toBe('combatant123');
    });
  });

  describe('CombatantsListResponse', () => {
    it('should have correct structure with empty array', () => {
      const response: CombatantsListResponse = {
        combatants: [],
      };

      expect(response.combatants).toHaveLength(0);
    });

    it('should have correct structure with multiple combatants', () => {
      const response: CombatantsListResponse = {
        combatants: [
          {
            id: 'combatant1',
            combatId: 'combat1',
            actorId: 'actor1',
            tokenId: 'token1',
            initiative: 18,
            initiativeModifier: 3,
            hidden: false,
            defeated: false,
            data: {},
            createdAt: new Date(),
          },
          {
            id: 'combatant2',
            combatId: 'combat1',
            actorId: 'actor2',
            tokenId: 'token2',
            initiative: 12,
            initiativeModifier: 1,
            hidden: false,
            defeated: true,
            data: {},
            createdAt: new Date(),
          },
        ],
      };

      expect(response.combatants).toHaveLength(2);
      expect(response.combatants[0].id).toBe('combatant1');
      expect(response.combatants[1].id).toBe('combatant2');
      expect(response.combatants[0].initiative).toBe(18);
      expect(response.combatants[1].defeated).toBe(true);
    });
  });
});
