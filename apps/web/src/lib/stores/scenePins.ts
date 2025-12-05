import { writable } from 'svelte/store';
import type { ScenePin } from '@vtt/shared';
import { browser } from '$app/environment';
import { API_BASE_URL } from '$lib/config/api';

interface ScenePinsState {
  pins: Map<string, ScenePin>;
  selectedPinId: string | null;
  loading: boolean;
  error: string | null;
}

function createScenePinsStore() {
  const { subscribe, set, update } = writable<ScenePinsState>({
    pins: new Map(),
    selectedPinId: null,
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Load pins for a scene from the API
     */
    async loadPins(sceneId: string): Promise<void> {
      if (!browser) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/pins`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch scene pins: ${response.statusText}`);
        }

        const data = await response.json();
        const pins = new Map<string, ScenePin>();

        if (data.pins && Array.isArray(data.pins)) {
          data.pins.forEach((pin: ScenePin) => {
            pins.set(pin.id, pin);
          });
        }

        update(state => ({
          ...state,
          pins,
          loading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load scene pins';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        console.error('Error loading scene pins:', error);
      }
    },

    /**
     * Create a new pin via API
     */
    async createPin(sceneId: string, pinData: Partial<ScenePin>): Promise<ScenePin | null> {
      if (!browser) return null;

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/pins`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pinData),
        });

        if (!response.ok) {
          throw new Error(`Failed to create pin: ${response.statusText}`);
        }

        const data = await response.json();
        const pin = data.pin;

        // Add to store
        update(state => {
          const newPins = new Map(state.pins);
          newPins.set(pin.id, pin);
          return {
            ...state,
            pins: newPins,
          };
        });

        return pin;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create pin';
        update(state => ({
          ...state,
          error: errorMessage,
        }));
        console.error('Error creating pin:', error);
        return null;
      }
    },

    /**
     * Update a pin via API
     */
    async updatePin(pinId: string, updates: Partial<ScenePin>): Promise<void> {
      if (!browser) return;

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/pins/${pinId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update pin: ${response.statusText}`);
        }

        const data = await response.json();
        const updatedPin = data.pin;

        // Update in store
        update(state => {
          const newPins = new Map(state.pins);
          newPins.set(pinId, updatedPin);
          return {
            ...state,
            pins: newPins,
          };
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update pin';
        update(state => ({
          ...state,
          error: errorMessage,
        }));
        console.error('Error updating pin:', error);
      }
    },

    /**
     * Delete a pin via API
     */
    async deletePin(pinId: string): Promise<void> {
      if (!browser) return;

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/pins/${pinId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to delete pin: ${response.statusText}`);
        }

        // Remove from store
        update(state => {
          const newPins = new Map(state.pins);
          newPins.delete(pinId);
          return {
            ...state,
            pins: newPins,
            selectedPinId: state.selectedPinId === pinId ? null : state.selectedPinId,
          };
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete pin';
        update(state => ({
          ...state,
          error: errorMessage,
        }));
        console.error('Error deleting pin:', error);
      }
    },

    /**
     * Add a pin to the store (for WebSocket updates)
     */
    addPin(pin: ScenePin): void {
      update(state => {
        const newPins = new Map(state.pins);
        newPins.set(pin.id, pin);
        return {
          ...state,
          pins: newPins,
        };
      });
    },

    /**
     * Update a pin in the store (for WebSocket updates)
     */
    updatePinLocal(pinId: string, updates: Partial<ScenePin>): void {
      update(state => {
        const pin = state.pins.get(pinId);
        if (!pin) return state;

        const updatedPin = { ...pin, ...updates };
        const newPins = new Map(state.pins);
        newPins.set(pinId, updatedPin);

        return {
          ...state,
          pins: newPins,
        };
      });
    },

    /**
     * Remove a pin from the store (for WebSocket updates)
     */
    removePin(pinId: string): void {
      update(state => {
        const newPins = new Map(state.pins);
        newPins.delete(pinId);

        return {
          ...state,
          pins: newPins,
          selectedPinId: state.selectedPinId === pinId ? null : state.selectedPinId,
        };
      });
    },

    /**
     * Select a pin
     */
    selectPin(pinId: string | null): void {
      update(state => ({
        ...state,
        selectedPinId: pinId,
      }));
    },

    /**
     * Get pins for a specific scene
     */
    getPinsForScene(sceneId: string, currentState: ScenePinsState): ScenePin[] {
      return Array.from(currentState.pins.values()).filter(
        pin => pin.sceneId === sceneId || pin.global
      );
    },

    /**
     * Clear all pins (useful when switching scenes or leaving a game)
     */
    clear(): void {
      set({
        pins: new Map(),
        selectedPinId: null,
        loading: false,
        error: null,
      });
    },
  };
}

export const scenePinsStore = createScenePinsStore();
