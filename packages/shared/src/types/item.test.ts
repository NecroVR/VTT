import { describe, it, expect } from 'vitest';
import type {
  Item,
  CreateItemRequest,
  UpdateItemRequest,
  ItemResponse,
  ItemsListResponse,
} from './item';

describe('Item Types', () => {
  describe('Item', () => {
    it('should have correct structure for basic item', () => {
      const item: Item = {
        id: 'item123',
        gameId: 'game123',
        actorId: null,
        name: 'Longsword',
        itemType: 'weapon',
        img: null,
        description: null,
        quantity: 1,
        weight: 3,
        price: 15,
        equipped: false,
        data: {},
        sort: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(item.id).toBe('item123');
      expect(item.gameId).toBe('game123');
      expect(item.name).toBe('Longsword');
      expect(item.itemType).toBe('weapon');
    });

    it('should handle item with actor reference', () => {
      const item: Item = {
        id: 'item1',
        gameId: 'game1',
        actorId: 'actor123',
        name: 'Healing Potion',
        itemType: 'consumable',
        img: null,
        description: null,
        quantity: 3,
        weight: 0.5,
        price: 50,
        equipped: false,
        data: {},
        sort: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(item.actorId).toBe('actor123');
      expect(item.quantity).toBe(3);
    });

    it('should handle item with image', () => {
      const item: Item = {
        id: 'item1',
        gameId: 'game1',
        actorId: null,
        name: 'Magic Staff',
        itemType: 'weapon',
        img: 'https://example.com/staff.png',
        description: null,
        quantity: 1,
        weight: 4,
        price: 1000,
        equipped: true,
        data: {},
        sort: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(item.img).toBe('https://example.com/staff.png');
      expect(item.equipped).toBe(true);
    });

    it('should handle item with description', () => {
      const item: Item = {
        id: 'item1',
        gameId: 'game1',
        actorId: null,
        name: 'Ring of Protection',
        itemType: 'equipment',
        img: null,
        description: 'Grants +1 to AC',
        quantity: 1,
        weight: 0,
        price: 500,
        equipped: true,
        data: {},
        sort: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(item.description).toBe('Grants +1 to AC');
    });

    it('should handle different item types', () => {
      const armor: Item = {
        id: 'item1',
        gameId: 'game1',
        actorId: null,
        name: 'Plate Armor',
        itemType: 'armor',
        img: null,
        description: null,
        quantity: 1,
        weight: 65,
        price: 1500,
        equipped: true,
        data: { ac: 18 },
        sort: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(armor.itemType).toBe('armor');
      expect(armor.weight).toBe(65);
    });

    it('should handle consumable items', () => {
      const item: Item = {
        id: 'item1',
        gameId: 'game1',
        actorId: 'actor1',
        name: 'Ration',
        itemType: 'consumable',
        img: null,
        description: 'Food for one day',
        quantity: 10,
        weight: 2,
        price: 5,
        equipped: false,
        data: {},
        sort: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(item.itemType).toBe('consumable');
      expect(item.quantity).toBe(10);
    });

    it('should handle equipped state', () => {
      const item: Item = {
        id: 'item1',
        gameId: 'game1',
        actorId: 'actor1',
        name: 'Shield',
        itemType: 'equipment',
        img: null,
        description: null,
        quantity: 1,
        weight: 6,
        price: 10,
        equipped: true,
        data: { acBonus: 2 },
        sort: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(item.equipped).toBe(true);
      expect(item.data.acBonus).toBe(2);
    });

    it('should handle zero weight items', () => {
      const item: Item = {
        id: 'item1',
        gameId: 'game1',
        actorId: null,
        name: 'Coin',
        itemType: 'treasure',
        img: null,
        description: null,
        quantity: 100,
        weight: 0,
        price: 1,
        equipped: false,
        data: {},
        sort: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(item.weight).toBe(0);
      expect(item.quantity).toBe(100);
    });

    it('should handle sort order', () => {
      const item: Item = {
        id: 'item1',
        gameId: 'game1',
        actorId: null,
        name: 'Item',
        itemType: 'misc',
        img: null,
        description: null,
        quantity: 1,
        weight: 1,
        price: 1,
        equipped: false,
        data: {},
        sort: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(item.sort).toBe(5);
    });

    it('should handle custom data', () => {
      const item: Item = {
        id: 'item1',
        gameId: 'game1',
        actorId: null,
        name: 'Magic Sword',
        itemType: 'weapon',
        img: null,
        description: null,
        quantity: 1,
        weight: 3,
        price: 5000,
        equipped: true,
        data: {
          damage: '1d8+2',
          properties: ['finesse', 'versatile'],
          magical: true,
        },
        sort: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(item.data.damage).toBe('1d8+2');
      expect(item.data.magical).toBe(true);
    });
  });

  describe('CreateItemRequest', () => {
    it('should have correct structure with minimal fields', () => {
      const request: CreateItemRequest = {
        gameId: 'game123',
        name: 'New Item',
        itemType: 'misc',
      };

      expect(request.gameId).toBe('game123');
      expect(request.name).toBe('New Item');
      expect(request.itemType).toBe('misc');
    });

    it('should handle all optional fields', () => {
      const request: CreateItemRequest = {
        gameId: 'game123',
        actorId: 'actor123',
        name: 'Complete Item',
        itemType: 'weapon',
        img: 'https://example.com/item.png',
        description: 'A powerful weapon',
        quantity: 1,
        weight: 5,
        price: 100,
        equipped: true,
        data: { damage: '2d6' },
        sort: 10,
      };

      expect(request.actorId).toBe('actor123');
      expect(request.img).toBe('https://example.com/item.png');
      expect(request.description).toBe('A powerful weapon');
      expect(request.quantity).toBe(1);
      expect(request.equipped).toBe(true);
    });

    it('should handle item without actor', () => {
      const request: CreateItemRequest = {
        gameId: 'game123',
        actorId: null,
        name: 'Unassigned Item',
        itemType: 'treasure',
      };

      expect(request.actorId).toBeNull();
    });

    it('should handle consumable creation', () => {
      const request: CreateItemRequest = {
        gameId: 'game123',
        actorId: 'actor123',
        name: 'Healing Potion',
        itemType: 'consumable',
        quantity: 5,
        weight: 0.5,
        price: 50,
        data: { healing: '2d4+2' },
      };

      expect(request.itemType).toBe('consumable');
      expect(request.quantity).toBe(5);
    });
  });

  describe('UpdateItemRequest', () => {
    it('should allow updating name only', () => {
      const request: UpdateItemRequest = {
        name: 'Updated Name',
      };

      expect(request.name).toBe('Updated Name');
    });

    it('should allow updating actor assignment', () => {
      const request: UpdateItemRequest = {
        actorId: 'newactor123',
      };

      expect(request.actorId).toBe('newactor123');
    });

    it('should allow clearing actor assignment', () => {
      const request: UpdateItemRequest = {
        actorId: null,
      };

      expect(request.actorId).toBeNull();
    });

    it('should allow updating item type', () => {
      const request: UpdateItemRequest = {
        itemType: 'equipment',
      };

      expect(request.itemType).toBe('equipment');
    });

    it('should allow updating image', () => {
      const request: UpdateItemRequest = {
        img: 'https://example.com/new-item.png',
      };

      expect(request.img).toBe('https://example.com/new-item.png');
    });

    it('should allow updating description', () => {
      const request: UpdateItemRequest = {
        description: 'Updated description',
      };

      expect(request.description).toBe('Updated description');
    });

    it('should allow updating quantity', () => {
      const request: UpdateItemRequest = {
        quantity: 10,
      };

      expect(request.quantity).toBe(10);
    });

    it('should allow updating weight', () => {
      const request: UpdateItemRequest = {
        weight: 2.5,
      };

      expect(request.weight).toBe(2.5);
    });

    it('should allow updating price', () => {
      const request: UpdateItemRequest = {
        price: 250,
      };

      expect(request.price).toBe(250);
    });

    it('should allow updating equipped state', () => {
      const request: UpdateItemRequest = {
        equipped: true,
      };

      expect(request.equipped).toBe(true);
    });

    it('should allow updating custom data', () => {
      const request: UpdateItemRequest = {
        data: { enchanted: true, bonus: 1 },
      };

      expect(request.data).toEqual({ enchanted: true, bonus: 1 });
    });

    it('should allow updating sort order', () => {
      const request: UpdateItemRequest = {
        sort: 15,
      };

      expect(request.sort).toBe(15);
    });

    it('should allow updating multiple fields', () => {
      const request: UpdateItemRequest = {
        name: 'Updated Item',
        quantity: 5,
        equipped: false,
        price: 100,
      };

      expect(request.name).toBe('Updated Item');
      expect(request.quantity).toBe(5);
      expect(request.equipped).toBe(false);
      expect(request.price).toBe(100);
    });
  });

  describe('ItemResponse', () => {
    it('should have correct structure', () => {
      const response: ItemResponse = {
        item: {
          id: 'item123',
          gameId: 'game123',
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
        },
      };

      expect(response.item).toBeDefined();
      expect(response.item.id).toBe('item123');
    });
  });

  describe('ItemsListResponse', () => {
    it('should have correct structure with empty array', () => {
      const response: ItemsListResponse = {
        items: [],
      };

      expect(response.items).toHaveLength(0);
    });

    it('should have correct structure with multiple items', () => {
      const response: ItemsListResponse = {
        items: [
          {
            id: 'item1',
            gameId: 'game1',
            actorId: 'actor1',
            name: 'Sword',
            itemType: 'weapon',
            img: null,
            description: null,
            quantity: 1,
            weight: 3,
            price: 15,
            equipped: true,
            data: {},
            sort: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'item2',
            gameId: 'game1',
            actorId: 'actor1',
            name: 'Potion',
            itemType: 'consumable',
            img: null,
            description: null,
            quantity: 3,
            weight: 0.5,
            price: 50,
            equipped: false,
            data: {},
            sort: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      expect(response.items).toHaveLength(2);
      expect(response.items[0].id).toBe('item1');
      expect(response.items[1].id).toBe('item2');
      expect(response.items[0].itemType).toBe('weapon');
      expect(response.items[1].itemType).toBe('consumable');
    });
  });
});
