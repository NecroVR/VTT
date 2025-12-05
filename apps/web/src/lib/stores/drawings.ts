import { writable } from 'svelte/store';
import type { Drawing, DrawingType, DrawingPoint } from '@vtt/shared';
import { browser } from '$app/environment';
import { API_BASE_URL } from '$lib/config/api';

interface DrawingsState {
  drawings: Map<string, Drawing>;
  selectedDrawingId: string | null;
  activeDrawing: {
    type: DrawingType | null;
    strokeColor: string;
    strokeWidth: number;
    strokeAlpha: number;
    fillColor: string | null;
    fillAlpha: number;
    fontSize: number;
    fontFamily: string;
    tempPoints?: DrawingPoint[];
    tempDrawingId?: string;
  };
  loading: boolean;
  error: string | null;
}

function createDrawingsStore() {
  const { subscribe, set, update } = writable<DrawingsState>({
    drawings: new Map(),
    selectedDrawingId: null,
    activeDrawing: {
      type: null,
      strokeColor: '#000000',
      strokeWidth: 2,
      strokeAlpha: 1,
      fillColor: null,
      fillAlpha: 0.5,
      fontSize: 16,
      fontFamily: 'Arial',
    },
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Load drawings for a scene from the API
     */
    async loadDrawings(sceneId: string): Promise<void> {
      if (!browser) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/drawings`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch drawings: ${response.statusText}`);
        }

        const data = await response.json();
        const drawings = new Map<string, Drawing>();

        if (data.drawings && Array.isArray(data.drawings)) {
          data.drawings.forEach((drawing: Drawing) => {
            drawings.set(drawing.id, drawing);
          });
        }

        update(state => ({
          ...state,
          drawings,
          loading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load drawings';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        console.error('Error loading drawings:', error);
      }
    },

    /**
     * Add a drawing to the store
     */
    addDrawing(drawing: Drawing): void {
      update(state => {
        const newDrawings = new Map(state.drawings);
        newDrawings.set(drawing.id, drawing);
        return {
          ...state,
          drawings: newDrawings,
        };
      });
    },

    /**
     * Update a drawing with partial data
     */
    updateDrawing(drawingId: string, updates: Partial<Drawing>): void {
      update(state => {
        const drawing = state.drawings.get(drawingId);
        if (!drawing) return state;

        const updatedDrawing = { ...drawing, ...updates };
        const newDrawings = new Map(state.drawings);
        newDrawings.set(drawingId, updatedDrawing);

        return {
          ...state,
          drawings: newDrawings,
        };
      });
    },

    /**
     * Remove a drawing from the store
     */
    removeDrawing(drawingId: string): void {
      update(state => {
        const newDrawings = new Map(state.drawings);
        newDrawings.delete(drawingId);

        return {
          ...state,
          drawings: newDrawings,
          selectedDrawingId: state.selectedDrawingId === drawingId ? null : state.selectedDrawingId,
        };
      });
    },

    /**
     * Select a drawing
     */
    selectDrawing(drawingId: string | null): void {
      update(state => ({
        ...state,
        selectedDrawingId: drawingId,
      }));
    },

    /**
     * Set the active drawing tool
     */
    setActiveDrawingTool(type: DrawingType | null): void {
      update(state => ({
        ...state,
        activeDrawing: {
          ...state.activeDrawing,
          type,
          tempPoints: undefined,
          tempDrawingId: undefined,
        },
      }));
    },

    /**
     * Update active drawing settings
     */
    updateActiveDrawingSettings(settings: Partial<DrawingsState['activeDrawing']>): void {
      update(state => ({
        ...state,
        activeDrawing: {
          ...state.activeDrawing,
          ...settings,
        },
      }));
    },

    /**
     * Start a temporary drawing (for freehand)
     */
    startTempDrawing(drawingId: string, points: DrawingPoint[]): void {
      update(state => ({
        ...state,
        activeDrawing: {
          ...state.activeDrawing,
          tempDrawingId: drawingId,
          tempPoints: points,
        },
      }));
    },

    /**
     * Add points to temporary drawing (for freehand streaming)
     */
    addTempDrawingPoints(points: DrawingPoint[]): void {
      update(state => ({
        ...state,
        activeDrawing: {
          ...state.activeDrawing,
          tempPoints: [...(state.activeDrawing.tempPoints || []), ...points],
        },
      }));
    },

    /**
     * Clear temporary drawing
     */
    clearTempDrawing(): void {
      update(state => ({
        ...state,
        activeDrawing: {
          ...state.activeDrawing,
          tempDrawingId: undefined,
          tempPoints: undefined,
        },
      }));
    },

    /**
     * Get drawings for a specific scene
     */
    getDrawingsForScene(sceneId: string, currentState: DrawingsState): Drawing[] {
      return Array.from(currentState.drawings.values())
        .filter(drawing => drawing.sceneId === sceneId)
        .sort((a, b) => a.z - b.z); // Sort by z-index
    },

    /**
     * Clear all drawings (useful when switching scenes or leaving a game)
     */
    clear(): void {
      set({
        drawings: new Map(),
        selectedDrawingId: null,
        activeDrawing: {
          type: null,
          strokeColor: '#000000',
          strokeWidth: 2,
          strokeAlpha: 1,
          fillColor: null,
          fillAlpha: 0.5,
          fontSize: 16,
          fontFamily: 'Arial',
        },
        loading: false,
        error: null,
      });
    },
  };
}

export const drawingsStore = createDrawingsStore();
