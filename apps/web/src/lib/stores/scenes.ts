import { writable } from 'svelte/store';
import type { Scene } from '@vtt/shared';
import { browser } from '$app/environment';
import { API_BASE_URL } from '$lib/config/api';

interface ScenesState {
  scenes: Map<string, Scene>;
  activeSceneId: string | null;
  loading: boolean;
  error: string | null;
}

function createScenesStore() {
  const { subscribe, set, update } = writable<ScenesState>({
    scenes: new Map(),
    activeSceneId: null,
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Load scenes for a campaign from the API
     */
    async loadScenes(campaignId: string): Promise<void> {
      if (!browser) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/${campaignId}/scenes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch scenes: ${response.statusText}`);
        }

        const data = await response.json();
        const scenes = new Map<string, Scene>();
        let activeSceneId: string | null = null;

        if (data.scenes && Array.isArray(data.scenes)) {
          data.scenes.forEach((scene: Scene) => {
            scenes.set(scene.id, scene);
            if (scene.active) {
              activeSceneId = scene.id;
            }
          });
        }

        // Try to restore active scene from localStorage
        const savedActiveSceneId = localStorage.getItem(`vtt_active_scene_${campaignId}`);

        // Priority: 1) localStorage (if valid) 2) API-marked active 3) First scene
        if (savedActiveSceneId && scenes.has(savedActiveSceneId)) {
          activeSceneId = savedActiveSceneId;
        } else if (!activeSceneId && scenes.size > 0) {
          activeSceneId = scenes.values().next().value.id;
        }

        update(state => ({
          ...state,
          scenes,
          activeSceneId,
          loading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load scenes';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        console.error('Error loading scenes:', error);
      }
    },

    /**
     * Set the active scene
     */
    setActiveScene(sceneId: string | null, campaignId?: string): void {
      // Save to localStorage if browser environment and campaignId provided
      if (browser && sceneId && campaignId) {
        localStorage.setItem(`vtt_active_scene_${campaignId}`, sceneId);
      }

      update(state => ({
        ...state,
        activeSceneId: sceneId,
      }));
    },

    /**
     * Add a scene to the store
     */
    addScene(scene: Scene): void {
      update(state => {
        const newScenes = new Map(state.scenes);
        newScenes.set(scene.id, scene);
        return {
          ...state,
          scenes: newScenes,
          // If this is the first scene or it's marked as active, set it as active
          activeSceneId: state.activeSceneId || scene.id,
        };
      });
    },

    /**
     * Update a scene with partial data
     */
    updateScene(sceneId: string, updates: Partial<Scene>): void {
      update(state => {
        const scene = state.scenes.get(sceneId);
        if (!scene) return state;

        const updatedScene = { ...scene, ...updates };
        const newScenes = new Map(state.scenes);
        newScenes.set(sceneId, updatedScene);

        return {
          ...state,
          scenes: newScenes,
        };
      });
    },

    /**
     * Remove a scene from the store
     */
    removeScene(sceneId: string): void {
      update(state => {
        const newScenes = new Map(state.scenes);
        newScenes.delete(sceneId);

        // If the removed scene was active, select the first available scene
        let newActiveSceneId = state.activeSceneId;
        if (state.activeSceneId === sceneId) {
          newActiveSceneId = newScenes.size > 0 ? newScenes.values().next().value.id : null;
        }

        return {
          ...state,
          scenes: newScenes,
          activeSceneId: newActiveSceneId,
        };
      });
    },

    /**
     * Get a scene by ID
     */
    getScene(sceneId: string, currentState: ScenesState): Scene | undefined {
      return currentState.scenes.get(sceneId);
    },

    /**
     * Create a new scene via API
     */
    async createScene(
      campaignId: string,
      name: string,
      options?: {
        gridSize?: number;
        gridColor?: string;
        backgroundColor?: string;
      }
    ): Promise<Scene | null> {
      if (!browser) return null;

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/campaigns/${campaignId}/scenes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            campaignId,
            gridSize: options?.gridSize,
            gridColor: options?.gridColor,
            // Note: backgroundColor would be backgroundImage or other scene properties
            // For now, only passing through the supported options
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create scene: ${response.statusText}`);
        }

        const data = await response.json();
        const newScene: Scene = data.scene;

        // Add scene to local state
        update(state => {
          const newScenes = new Map(state.scenes);
          newScenes.set(newScene.id, newScene);
          return {
            ...state,
            scenes: newScenes,
            activeSceneId: newScene.id, // Set new scene as active
          };
        });

        return newScene;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create scene';
        update(state => ({
          ...state,
          error: errorMessage,
        }));
        console.error('Error creating scene:', error);
        return null;
      }
    },

    /**
     * Update a scene via API
     */
    async updateSceneApi(sceneId: string, updates: Partial<Scene>): Promise<boolean> {
      if (!browser) return false;

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update scene: ${response.statusText}`);
        }

        const data = await response.json();
        const updatedScene: Scene = data.scene;

        // Update scene in local state
        update(state => {
          const newScenes = new Map(state.scenes);
          newScenes.set(sceneId, updatedScene);
          return {
            ...state,
            scenes: newScenes,
          };
        });

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update scene';
        update(state => ({
          ...state,
          error: errorMessage,
        }));
        console.error('Error updating scene:', error);
        return false;
      }
    },

    /**
     * Delete a scene via API
     */
    async deleteScene(sceneId: string): Promise<boolean> {
      if (!browser) return false;

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to delete scene: ${response.statusText}`);
        }

        // Remove scene from local state
        update(state => {
          const newScenes = new Map(state.scenes);
          newScenes.delete(sceneId);

          // If deleted scene was active, switch to another scene or null
          let newActiveSceneId = state.activeSceneId;
          if (state.activeSceneId === sceneId) {
            newActiveSceneId = newScenes.size > 0 ? newScenes.values().next().value.id : null;
          }

          return {
            ...state,
            scenes: newScenes,
            activeSceneId: newActiveSceneId,
          };
        });

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete scene';
        update(state => ({
          ...state,
          error: errorMessage,
        }));
        console.error('Error deleting scene:', error);
        return false;
      }
    },

    /**
     * Clear all scenes (useful when leaving a campaign)
     */
    clear(): void {
      set({
        scenes: new Map(),
        activeSceneId: null,
        loading: false,
        error: null,
      });
    },
  };
}

export const scenesStore = createScenesStore();
