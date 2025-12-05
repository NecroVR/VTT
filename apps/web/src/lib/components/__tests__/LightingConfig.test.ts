import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import LightingConfig from '../LightingConfig.svelte';
import type { AmbientLight } from '@vtt/shared';

// Mock fetch
global.fetch = vi.fn();

describe('LightingConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when isOpen is true', () => {
    const { container } = render(LightingConfig, {
      props: {
        isOpen: true,
        light: null,
        sceneId: 'scene-1',
        token: 'test-token',
      },
    });

    expect(container.querySelector('.modal-backdrop')).toBeTruthy();
    expect(container.textContent).toContain('Add Ambient Light');
  });

  it('does not render modal when isOpen is false', () => {
    const { container } = render(LightingConfig, {
      props: {
        isOpen: false,
        light: null,
        sceneId: 'scene-1',
        token: 'test-token',
      },
    });

    expect(container.querySelector('.modal-backdrop')).toBeFalsy();
  });

  it('shows edit mode for existing light', () => {
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

    const { container } = render(LightingConfig, {
      props: {
        isOpen: true,
        light: mockLight,
        sceneId: 'scene-1',
        token: 'test-token',
      },
    });

    expect(container.textContent).toContain('Edit Ambient Light');
    expect(container.querySelector('.button-danger')).toBeTruthy(); // Delete button
  });

  it('uses default position for new light', () => {
    const { container } = render(LightingConfig, {
      props: {
        isOpen: true,
        light: null,
        sceneId: 'scene-1',
        defaultX: 300,
        defaultY: 400,
        token: 'test-token',
      },
    });

    const xInput = container.querySelector('#light-x') as HTMLInputElement;
    const yInput = container.querySelector('#light-y') as HTMLInputElement;

    expect(xInput.value).toBe('300');
    expect(yInput.value).toBe('400');
  });

  it('renders cancel button', async () => {
    const { getByText } = render(LightingConfig, {
      props: {
        isOpen: true,
        light: null,
        sceneId: 'scene-1',
        token: 'test-token',
      },
    });

    const cancelButton = getByText('Cancel');
    expect(cancelButton).toBeTruthy();
  });

  it('shows animation controls when animation type is selected', async () => {
    const { container, getByLabelText } = render(LightingConfig, {
      props: {
        isOpen: true,
        light: null,
        sceneId: 'scene-1',
        token: 'test-token',
      },
    });

    // Initially animation controls should not be visible
    expect(container.querySelector('#light-anim-speed')).toBeFalsy();

    // Select an animation type
    const animationSelect = getByLabelText('Animation Type') as HTMLSelectElement;
    await fireEvent.change(animationSelect, { target: { value: 'torch' } });

    // Animation controls should now be visible
    expect(container.querySelector('#light-anim-speed')).toBeTruthy();
    expect(container.querySelector('#light-anim-intensity')).toBeTruthy();
  });

  it('has all required form fields', () => {
    const { container } = render(LightingConfig, {
      props: {
        isOpen: true,
        light: null,
        sceneId: 'scene-1',
        token: 'test-token',
      },
    });

    // Check for all critical form fields
    expect(container.querySelector('#light-x')).toBeTruthy();
    expect(container.querySelector('#light-y')).toBeTruthy();
    expect(container.querySelector('#light-rotation')).toBeTruthy();
    expect(container.querySelector('#light-bright')).toBeTruthy();
    expect(container.querySelector('#light-dim')).toBeTruthy();
    expect(container.querySelector('#light-angle')).toBeTruthy();
    expect(container.querySelector('#light-color')).toBeTruthy();
    expect(container.querySelector('#light-alpha')).toBeTruthy();
  });
});
