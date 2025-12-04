import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { scenesStore } from './scenes';
import type { Scene } from '@vtt/shared';

describe('scenes store', () => {
  const mockScene1: Scene = {
    id: 'scene-1',
    gameId: 'game-1',
    name: 'Test Scene 1',
    width: 1000,
    height: 1000,
    gridSize: 50,
    backgroundImage: null,
    active: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockScene2: Scene = {
    id: 'scene-2',
    gameId: 'game-1',
    name: 'Test Scene 2',
    width: 1200,
    height: 800,
    gridSize: 50,
    backgroundImage: null,
    active: false,
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    // Reset store to initial state
    scenesStore.clear();
    // Setup default localStorage mock
    global.localStorage.getItem = vi.fn().mockReturnValue('session-token-123');
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = get(scenesStore);
      expect(state.scenes).toBeInstanceOf(Map);
      expect(state.scenes.size).toBe(0);
      expect(state.activeSceneId).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('loadScenes', () => {
    it('should load scenes successfully', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ scenes: [mockScene1, mockScene2] }),
      } as Response);

      await scenesStore.loadScenes('game-1');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/games/game-1/scenes',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer session-token-123',
          },
        })
      );

      const state = get(scenesStore);
      expect(state.scenes.size).toBe(2);
      expect(state.scenes.get('scene-1')).toEqual(mockScene1);
      expect(state.scenes.get('scene-2')).toEqual(mockScene2);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set active scene from API response', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ scenes: [mockScene1, mockScene2] }),
      } as Response);

      await scenesStore.loadScenes('game-1');

      const state = get(scenesStore);
      expect(state.activeSceneId).toBe('scene-1'); // mockScene1 has active: true
    });

    it('should default to first scene if none marked active', async () => {
      const scene1NoActive = { ...mockScene1, active: false };
      const scene2NoActive = { ...mockScene2, active: false };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ scenes: [scene1NoActive, scene2NoActive] }),
      } as Response);

      await scenesStore.loadScenes('game-1');

      const state = get(scenesStore);
      expect(state.activeSceneId).toBe('scene-1'); // First scene is default
    });

    it('should handle no token error', async () => {
      global.localStorage.getItem = vi.fn().mockReturnValue(null);
      global.sessionStorage.getItem = vi.fn().mockReturnValue(null);

      await scenesStore.loadScenes('game-1');

      const state = get(scenesStore);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('No authentication token found');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle API error response', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      await scenesStore.loadScenes('game-1');

      const state = get(scenesStore);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to fetch scenes: Not Found');
    });

    it('should handle network error', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await scenesStore.loadScenes('game-1');

      const state = get(scenesStore);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
    });

    it('should check sessionStorage if localStorage has no token', async () => {
      global.localStorage.getItem = vi.fn().mockReturnValue(null);
      global.sessionStorage.getItem = vi.fn().mockReturnValue('session-storage-token');

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ scenes: [mockScene1] }),
      } as Response);

      await scenesStore.loadScenes('game-1');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/games/game-1/scenes',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer session-storage-token',
          },
        })
      );
    });
  });

  describe('setActiveScene', () => {
    it('should set active scene ID', () => {
      scenesStore.setActiveScene('scene-123');

      const state = get(scenesStore);
      expect(state.activeSceneId).toBe('scene-123');
    });

    it('should allow setting active scene to null', () => {
      scenesStore.setActiveScene('scene-123');
      scenesStore.setActiveScene(null);

      const state = get(scenesStore);
      expect(state.activeSceneId).toBeNull();
    });
  });

  describe('addScene', () => {
    it('should add scene to store', () => {
      scenesStore.addScene(mockScene1);

      const state = get(scenesStore);
      expect(state.scenes.get('scene-1')).toEqual(mockScene1);
    });

    it('should set first scene as active', () => {
      scenesStore.addScene(mockScene1);

      const state = get(scenesStore);
      expect(state.activeSceneId).toBe('scene-1');
    });

    it('should not change active scene if one already set', () => {
      scenesStore.addScene(mockScene1);
      scenesStore.addScene(mockScene2);

      const state = get(scenesStore);
      expect(state.activeSceneId).toBe('scene-1'); // Still first scene
      expect(state.scenes.size).toBe(2);
    });
  });

  describe('updateScene', () => {
    it('should update scene with partial data', () => {
      scenesStore.addScene(mockScene1);

      scenesStore.updateScene('scene-1', { name: 'Updated Name' });

      const state = get(scenesStore);
      const scene = state.scenes.get('scene-1');
      expect(scene?.name).toBe('Updated Name');
      expect(scene?.width).toBe(1000); // Other properties unchanged
    });

    it('should handle updating non-existent scene', () => {
      scenesStore.addScene(mockScene1);

      scenesStore.updateScene('nonexistent', { name: 'New Name' });

      const state = get(scenesStore);
      expect(state.scenes.size).toBe(1);
      expect(state.scenes.get('nonexistent')).toBeUndefined();
    });

    it('should update multiple properties', () => {
      scenesStore.addScene(mockScene1);

      scenesStore.updateScene('scene-1', {
        name: 'New Name',
        width: 2000,
        height: 1500,
      });

      const state = get(scenesStore);
      const scene = state.scenes.get('scene-1');
      expect(scene?.name).toBe('New Name');
      expect(scene?.width).toBe(2000);
      expect(scene?.height).toBe(1500);
    });
  });

  describe('removeScene', () => {
    it('should remove scene from store', () => {
      scenesStore.addScene(mockScene1);
      scenesStore.addScene(mockScene2);

      scenesStore.removeScene('scene-2');

      const state = get(scenesStore);
      expect(state.scenes.size).toBe(1);
      expect(state.scenes.get('scene-2')).toBeUndefined();
      expect(state.scenes.get('scene-1')).toEqual(mockScene1);
    });

    it('should update activeSceneId when active scene is removed', () => {
      scenesStore.addScene(mockScene1);
      scenesStore.addScene(mockScene2);
      scenesStore.setActiveScene('scene-1');

      scenesStore.removeScene('scene-1');

      const state = get(scenesStore);
      expect(state.activeSceneId).toBe('scene-2'); // Switches to remaining scene
    });

    it('should set activeSceneId to null when last scene removed', () => {
      scenesStore.addScene(mockScene1);
      scenesStore.setActiveScene('scene-1');

      scenesStore.removeScene('scene-1');

      const state = get(scenesStore);
      expect(state.activeSceneId).toBeNull();
      expect(state.scenes.size).toBe(0);
    });

    it('should not change activeSceneId when non-active scene removed', () => {
      scenesStore.addScene(mockScene1);
      scenesStore.addScene(mockScene2);
      scenesStore.setActiveScene('scene-1');

      scenesStore.removeScene('scene-2');

      const state = get(scenesStore);
      expect(state.activeSceneId).toBe('scene-1');
    });
  });

  describe('getScene', () => {
    it('should get scene by ID', () => {
      scenesStore.addScene(mockScene1);
      scenesStore.addScene(mockScene2);

      const state = get(scenesStore);
      const scene = scenesStore.getScene('scene-1', state);

      expect(scene).toEqual(mockScene1);
    });

    it('should return undefined for non-existent scene', () => {
      const state = get(scenesStore);
      const scene = scenesStore.getScene('nonexistent', state);

      expect(scene).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all scenes and reset state', () => {
      scenesStore.addScene(mockScene1);
      scenesStore.addScene(mockScene2);
      scenesStore.setActiveScene('scene-1');

      scenesStore.clear();

      const state = get(scenesStore);
      expect(state.scenes.size).toBe(0);
      expect(state.activeSceneId).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
