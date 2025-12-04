import { writable } from 'svelte/store';
import type { Scene } from '@vtt/shared';
import { browser } from '$app/environment';

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
     * Load scenes for a game from the API
     */
    async loadScenes(gameId: string): Promise<void> {
      if (!browser) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`http://localhost:3000/api/v1/games/${gameId}/scenes`, {
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

        update(state => ({
          ...state,
          scenes,
          activeSceneId: activeSceneId || (scenes.size > 0 ? scenes.values().next().value.id : null),
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
    setActiveScene(sceneId: string | null): void {
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
     * Clear all scenes (useful when leaving a game)
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
