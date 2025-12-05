import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { lightsStore } from './lights';
import type { AmbientLight } from '@vtt/shared';

// Mock fetch
global.fetch = vi.fn();

const mockLight: AmbientLight = {
  id: 'light-1',
  sceneId: 'scene-1',
  x: 100,
  y: 200,
  rotation: 0,
  bright: 20,
  dim: 40,
  angle: 360,
  color: '#ffffff',
  alpha: 0.5,
  animationType: null,
  animationSpeed: 5,
  animationIntensity: 5,
  walls: true,
  vision: false,
  data: {},
  createdAt: new Date(),
};

describe('lightsStore', () => {
  beforeEach(() => {
    lightsStore.clear();
    vi.clearAllMocks();
  });

  it('initializes with empty state', () => {
    const state = get(lightsStore);
    expect(state.lights.size).toBe(0);
    expect(state.selectedLightId).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('adds a light to the store', () => {
    lightsStore.addLight(mockLight);

    const state = get(lightsStore);
    expect(state.lights.size).toBe(1);
    expect(state.lights.get('light-1')).toEqual(mockLight);
  });

  it('updates a light', () => {
    lightsStore.addLight(mockLight);
    lightsStore.updateLight('light-1', { bright: 30, dim: 60 });

    const state = get(lightsStore);
    const updatedLight = state.lights.get('light-1');
    expect(updatedLight?.bright).toBe(30);
    expect(updatedLight?.dim).toBe(60);
    expect(updatedLight?.x).toBe(100); // Original value unchanged
  });

  it('removes a light', () => {
    lightsStore.addLight(mockLight);
    lightsStore.removeLight('light-1');

    const state = get(lightsStore);
    expect(state.lights.size).toBe(0);
    expect(state.lights.get('light-1')).toBeUndefined();
  });

  it('selects a light', () => {
    lightsStore.addLight(mockLight);
    lightsStore.selectLight('light-1');

    const state = get(lightsStore);
    expect(state.selectedLightId).toBe('light-1');
  });

  it('deselects light when removed', () => {
    lightsStore.addLight(mockLight);
    lightsStore.selectLight('light-1');
    lightsStore.removeLight('light-1');

    const state = get(lightsStore);
    expect(state.selectedLightId).toBeNull();
  });

  it('filters lights by scene', () => {
    const light1 = { ...mockLight, id: 'light-1', sceneId: 'scene-1' };
    const light2 = { ...mockLight, id: 'light-2', sceneId: 'scene-2' };
    const light3 = { ...mockLight, id: 'light-3', sceneId: 'scene-1' };

    lightsStore.addLight(light1);
    lightsStore.addLight(light2);
    lightsStore.addLight(light3);

    const state = get(lightsStore);
    const scene1Lights = lightsStore.getLightsForScene('scene-1', state);

    expect(scene1Lights.length).toBe(2);
    expect(scene1Lights.map(l => l.id)).toEqual(['light-1', 'light-3']);
  });

  it('clears all lights', () => {
    lightsStore.addLight(mockLight);
    lightsStore.selectLight('light-1');
    lightsStore.clear();

    const state = get(lightsStore);
    expect(state.lights.size).toBe(0);
    expect(state.selectedLightId).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('loads lights from API successfully', async () => {
    const mockResponse = {
      ambientLights: [mockLight],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await lightsStore.loadLights('scene-1', 'test-token');

    const state = get(lightsStore);
    expect(state.lights.size).toBe(1);
    expect(state.lights.get('light-1')).toEqual(mockLight);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();

    expect(global.fetch).toHaveBeenCalledWith('/api/v1/scenes/scene-1/lights', {
      headers: {
        Authorization: 'Bearer test-token',
      },
    });
  });

  it('handles API errors when loading lights', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    });

    await lightsStore.loadLights('scene-1', 'test-token');

    const state = get(lightsStore);
    expect(state.lights.size).toBe(0);
    expect(state.loading).toBe(false);
    expect(state.error).toBeTruthy();
    expect(state.error).toContain('Not Found');
  });
});
