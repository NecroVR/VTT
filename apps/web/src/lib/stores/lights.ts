import { writable } from 'svelte/store';
import type { AmbientLight } from '@vtt/shared';

interface LightsState {
  lights: Map<string, AmbientLight>;
  selectedLightId: string | null;
  loading: boolean;
  error: string | null;
}

function createLightsStore() {
  const { subscribe, set, update } = writable<LightsState>({
    lights: new Map(),
    selectedLightId: null,
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Load lights for a scene
     */
    async loadLights(sceneId: string, token: string): Promise<void> {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`/api/v1/scenes/${sceneId}/lights`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch lights: ${response.statusText}`);
        }

        const data = await response.json();
        const lights = new Map<string, AmbientLight>();

        data.ambientLights.forEach((light: AmbientLight) => {
          lights.set(light.id, light);
        });

        update(state => ({
          ...state,
          lights,
          loading: false,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({
          ...state,
          loading: false,
          error: message,
        }));
        console.error('Failed to load lights:', error);
      }
    },

    /**
     * Add a light to the store
     */
    addLight(light: AmbientLight): void {
      update(state => {
        const newLights = new Map(state.lights);
        newLights.set(light.id, light);
        return {
          ...state,
          lights: newLights,
        };
      });
    },

    /**
     * Update a light with partial data
     */
    updateLight(lightId: string, updates: Partial<AmbientLight>): void {
      update(state => {
        const light = state.lights.get(lightId);
        if (!light) return state;

        const updatedLight = { ...light, ...updates };
        const newLights = new Map(state.lights);
        newLights.set(lightId, updatedLight);

        return {
          ...state,
          lights: newLights,
        };
      });
    },

    /**
     * Remove a light from the store
     */
    removeLight(lightId: string): void {
      update(state => {
        const newLights = new Map(state.lights);
        newLights.delete(lightId);

        return {
          ...state,
          lights: newLights,
          selectedLightId: state.selectedLightId === lightId ? null : state.selectedLightId,
        };
      });
    },

    /**
     * Select a light
     */
    selectLight(lightId: string | null): void {
      update(state => ({
        ...state,
        selectedLightId: lightId,
      }));
    },

    /**
     * Get lights for a specific scene
     */
    getLightsForScene(sceneId: string, currentState: LightsState): AmbientLight[] {
      return Array.from(currentState.lights.values()).filter(light => light.sceneId === sceneId);
    },

    /**
     * Clear all lights (useful when switching scenes or leaving a game)
     */
    clear(): void {
      set({
        lights: new Map(),
        selectedLightId: null,
        loading: false,
        error: null,
      });
    },
  };
}

export const lightsStore = createLightsStore();
