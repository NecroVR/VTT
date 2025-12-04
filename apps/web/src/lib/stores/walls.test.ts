import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { wallsStore } from './walls';
import type { Wall } from '@vtt/shared';

describe('walls store', () => {
  const mockWall1: Wall = {
    id: 'wall-1',
    sceneId: 'scene-1',
    x1: 100,
    y1: 100,
    x2: 200,
    y2: 100,
    blocksMovement: true,
    blocksVision: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockWall2: Wall = {
    id: 'wall-2',
    sceneId: 'scene-1',
    x1: 200,
    y1: 100,
    x2: 200,
    y2: 200,
    blocksMovement: true,
    blocksVision: false,
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02'),
  };

  const mockWall3: Wall = {
    id: 'wall-3',
    sceneId: 'scene-2',
    x1: 300,
    y1: 300,
    x2: 400,
    y2: 300,
    blocksMovement: false,
    blocksVision: true,
    createdAt: new Date('2025-01-03'),
    updatedAt: new Date('2025-01-03'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    // Reset store to initial state
    wallsStore.clear();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = get(wallsStore);
      expect(state.walls).toBeInstanceOf(Map);
      expect(state.walls.size).toBe(0);
      expect(state.selectedWallId).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('loadWalls', () => {
    it('should load walls for a specific scene', () => {
      wallsStore.loadWalls('scene-1', [mockWall1, mockWall2, mockWall3]);

      const state = get(wallsStore);
      expect(state.walls.size).toBe(2);
      expect(state.walls.get('wall-1')).toEqual(mockWall1);
      expect(state.walls.get('wall-2')).toEqual(mockWall2);
      expect(state.walls.get('wall-3')).toBeUndefined(); // Different scene
    });

    it('should filter walls by sceneId', () => {
      wallsStore.loadWalls('scene-2', [mockWall1, mockWall2, mockWall3]);

      const state = get(wallsStore);
      expect(state.walls.size).toBe(1);
      expect(state.walls.get('wall-3')).toEqual(mockWall3);
      expect(state.walls.get('wall-1')).toBeUndefined();
    });

    it('should handle empty walls array', () => {
      wallsStore.loadWalls('scene-1', []);

      const state = get(wallsStore);
      expect(state.walls.size).toBe(0);
      expect(state.loading).toBe(false);
    });

    it('should handle loading walls with no matching sceneId', () => {
      wallsStore.loadWalls('scene-999', [mockWall1, mockWall2, mockWall3]);

      const state = get(wallsStore);
      expect(state.walls.size).toBe(0);
    });

    it('should replace existing walls when loading new scene', () => {
      wallsStore.loadWalls('scene-1', [mockWall1, mockWall2]);

      let state = get(wallsStore);
      expect(state.walls.size).toBe(2);

      wallsStore.loadWalls('scene-2', [mockWall3]);

      state = get(wallsStore);
      expect(state.walls.size).toBe(1);
      expect(state.walls.get('wall-3')).toEqual(mockWall3);
      expect(state.walls.get('wall-1')).toBeUndefined();
    });
  });

  describe('addWall', () => {
    it('should add wall to store', () => {
      wallsStore.addWall(mockWall1);

      const state = get(wallsStore);
      expect(state.walls.get('wall-1')).toEqual(mockWall1);
      expect(state.walls.size).toBe(1);
    });

    it('should add multiple walls', () => {
      wallsStore.addWall(mockWall1);
      wallsStore.addWall(mockWall2);

      const state = get(wallsStore);
      expect(state.walls.size).toBe(2);
      expect(state.walls.get('wall-1')).toEqual(mockWall1);
      expect(state.walls.get('wall-2')).toEqual(mockWall2);
    });

    it('should overwrite existing wall with same ID', () => {
      wallsStore.addWall(mockWall1);

      const updatedWall = { ...mockWall1, x2: 300 };
      wallsStore.addWall(updatedWall);

      const state = get(wallsStore);
      expect(state.walls.size).toBe(1);
      expect(state.walls.get('wall-1')?.x2).toBe(300);
    });
  });

  describe('updateWall', () => {
    it('should update wall with partial data', () => {
      wallsStore.addWall(mockWall1);

      wallsStore.updateWall('wall-1', { x2: 250, y2: 150 });

      const state = get(wallsStore);
      const wall = state.walls.get('wall-1');
      expect(wall?.x2).toBe(250);
      expect(wall?.y2).toBe(150);
      expect(wall?.x1).toBe(100); // Other properties unchanged
      expect(wall?.y1).toBe(100);
    });

    it('should handle updating non-existent wall', () => {
      wallsStore.addWall(mockWall1);

      wallsStore.updateWall('nonexistent', { x2: 999 });

      const state = get(wallsStore);
      expect(state.walls.size).toBe(1);
      expect(state.walls.get('nonexistent')).toBeUndefined();
    });

    it('should update wall properties', () => {
      wallsStore.addWall(mockWall1);

      wallsStore.updateWall('wall-1', {
        blocksMovement: false,
        blocksVision: false,
      });

      const state = get(wallsStore);
      const wall = state.walls.get('wall-1');
      expect(wall?.blocksMovement).toBe(false);
      expect(wall?.blocksVision).toBe(false);
    });
  });

  describe('removeWall', () => {
    it('should remove wall from store', () => {
      wallsStore.addWall(mockWall1);
      wallsStore.addWall(mockWall2);

      wallsStore.removeWall('wall-1');

      const state = get(wallsStore);
      expect(state.walls.size).toBe(1);
      expect(state.walls.get('wall-1')).toBeUndefined();
      expect(state.walls.get('wall-2')).toEqual(mockWall2);
    });

    it('should clear selectedWallId when selected wall is removed', () => {
      wallsStore.addWall(mockWall1);
      wallsStore.selectWall('wall-1');

      wallsStore.removeWall('wall-1');

      const state = get(wallsStore);
      expect(state.selectedWallId).toBeNull();
    });

    it('should not change selectedWallId when different wall removed', () => {
      wallsStore.addWall(mockWall1);
      wallsStore.addWall(mockWall2);
      wallsStore.selectWall('wall-1');

      wallsStore.removeWall('wall-2');

      const state = get(wallsStore);
      expect(state.selectedWallId).toBe('wall-1');
    });

    it('should handle removing non-existent wall gracefully', () => {
      wallsStore.addWall(mockWall1);

      wallsStore.removeWall('nonexistent');

      const state = get(wallsStore);
      expect(state.walls.size).toBe(1);
      expect(state.walls.get('wall-1')).toEqual(mockWall1);
    });
  });

  describe('selectWall', () => {
    it('should select a wall', () => {
      wallsStore.addWall(mockWall1);
      wallsStore.selectWall('wall-1');

      const state = get(wallsStore);
      expect(state.selectedWallId).toBe('wall-1');
    });

    it('should allow deselecting by passing null', () => {
      wallsStore.addWall(mockWall1);
      wallsStore.selectWall('wall-1');
      wallsStore.selectWall(null);

      const state = get(wallsStore);
      expect(state.selectedWallId).toBeNull();
    });

    it('should change selected wall', () => {
      wallsStore.addWall(mockWall1);
      wallsStore.addWall(mockWall2);

      wallsStore.selectWall('wall-1');
      let state = get(wallsStore);
      expect(state.selectedWallId).toBe('wall-1');

      wallsStore.selectWall('wall-2');
      state = get(wallsStore);
      expect(state.selectedWallId).toBe('wall-2');
    });
  });

  describe('getWallsForScene', () => {
    it('should get all walls for a specific scene', () => {
      wallsStore.addWall(mockWall1);
      wallsStore.addWall(mockWall2);
      wallsStore.addWall(mockWall3);

      const state = get(wallsStore);
      const scene1Walls = wallsStore.getWallsForScene('scene-1', state);

      expect(scene1Walls).toHaveLength(2);
      expect(scene1Walls).toContainEqual(mockWall1);
      expect(scene1Walls).toContainEqual(mockWall2);
      expect(scene1Walls).not.toContainEqual(mockWall3);
    });

    it('should return empty array for scene with no walls', () => {
      wallsStore.addWall(mockWall1);

      const state = get(wallsStore);
      const walls = wallsStore.getWallsForScene('scene-999', state);

      expect(walls).toEqual([]);
    });

    it('should return empty array when no walls exist', () => {
      const state = get(wallsStore);
      const walls = wallsStore.getWallsForScene('scene-1', state);

      expect(walls).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all walls and reset state', () => {
      wallsStore.addWall(mockWall1);
      wallsStore.addWall(mockWall2);
      wallsStore.selectWall('wall-1');

      wallsStore.clear();

      const state = get(wallsStore);
      expect(state.walls.size).toBe(0);
      expect(state.selectedWallId).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
