import { writable } from 'svelte/store';
import type { FogExploration, FogGrid } from '@vtt/shared';
import { browser } from '$app/environment';
import { API_BASE_URL } from '$lib/config/api';

interface FogState {
  fog: Map<string, FogExploration>; // sceneId -> FogExploration
  loading: boolean;
  error: string | null;
}

function createFogStore() {
  const { subscribe, set, update } = writable<FogState>({
    fog: new Map(),
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Load fog exploration data for a scene
     */
    async loadFog(sceneId: string): Promise<void> {
      if (!browser) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/fog`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch fog data: ${response.statusText}`);
        }

        const data = await response.json();

        update(state => {
          const newFog = new Map(state.fog);
          newFog.set(sceneId, data.fog);
          return {
            ...state,
            fog: newFog,
            loading: false,
          };
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load fog data';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        console.error('Error loading fog data:', error);
      }
    },

    /**
     * Update explored areas for a scene
     */
    async updateExplored(sceneId: string, exploredGrid: FogGrid): Promise<void> {
      if (!browser) return;

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/fog/explore`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ exploredGrid }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update explored areas: ${response.statusText}`);
        }

        const data = await response.json();

        update(state => {
          const newFog = new Map(state.fog);
          newFog.set(sceneId, data.fog);
          return {
            ...state,
            fog: newFog,
          };
        });
      } catch (error) {
        console.error('Error updating explored areas:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update explored areas';
        update(state => ({
          ...state,
          error: errorMessage,
        }));
      }
    },

    /**
     * Reveal an area (GM only)
     */
    async revealArea(sceneId: string, x: number, y: number, width: number, height: number): Promise<void> {
      if (!browser) return;

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/fog/reveal`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ x, y, width, height }),
        });

        if (!response.ok) {
          throw new Error(`Failed to reveal area: ${response.statusText}`);
        }

        // Reload fog data
        await this.loadFog(sceneId);
      } catch (error) {
        console.error('Error revealing area:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to reveal area';
        update(state => ({
          ...state,
          error: errorMessage,
        }));
      }
    },

    /**
     * Hide an area (GM only)
     */
    async hideArea(sceneId: string, x: number, y: number, width: number, height: number): Promise<void> {
      if (!browser) return;

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/fog/hide`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ x, y, width, height }),
        });

        if (!response.ok) {
          throw new Error(`Failed to hide area: ${response.statusText}`);
        }

        // Reload fog data
        await this.loadFog(sceneId);
      } catch (error) {
        console.error('Error hiding area:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to hide area';
        update(state => ({
          ...state,
          error: errorMessage,
        }));
      }
    },

    /**
     * Reset all fog (GM only)
     */
    async resetFog(sceneId: string): Promise<void> {
      if (!browser) return;

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/fog/reset`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to reset fog: ${response.statusText}`);
        }

        // Reload fog data
        await this.loadFog(sceneId);
      } catch (error) {
        console.error('Error resetting fog:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to reset fog';
        update(state => ({
          ...state,
          error: errorMessage,
        }));
      }
    },

    /**
     * Get fog data for a scene
     */
    getFog(sceneId: string, currentState: FogState): FogExploration | undefined {
      return currentState.fog.get(sceneId);
    },

    /**
     * Update fog data locally (for optimistic updates)
     */
    updateFogLocal(sceneId: string, fog: FogExploration): void {
      update(state => {
        const newFog = new Map(state.fog);
        newFog.set(sceneId, fog);
        return {
          ...state,
          fog: newFog,
        };
      });
    },

    /**
     * Clear all fog data (useful when leaving a game)
     */
    clear(): void {
      set({
        fog: new Map(),
        loading: false,
        error: null,
      });
    },
  };
}

export const fogStore = createFogStore();
