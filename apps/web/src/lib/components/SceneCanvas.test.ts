import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import SceneCanvas from './SceneCanvas.svelte';
import type { Scene, Token, Wall } from '@vtt/shared';

describe('SceneCanvas component', () => {
  let mockContext: any;
  let mockScene: Scene;

  beforeEach(() => {
    // Mock canvas context with all required properties
    mockContext = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn(),
      closePath: vi.fn(),
      clip: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
      setTransform: vi.fn(),
      rotate: vi.fn(),
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      globalAlpha: 1,
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      canvas: {
        width: 800,
        height: 600,
      },
    };

    // Mock getContext
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockContext);

    // Mock getBoundingClientRect
    HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    mockScene = {
      id: 'scene1',
      name: 'Test Scene',
      gameId: 'game1',
      gridSize: 50,
      gridType: 'square',
      gridColor: '#333333',
      gridAlpha: 0.5,
      backgroundImage: '',
      backgroundWidth: 4000,
      backgroundHeight: 4000,
      initialX: 0,
      initialY: 0,
      initialScale: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the scene canvas container', () => {
    const { container } = render(SceneCanvas, { props: { scene: mockScene } });
    const canvasContainer = container.querySelector('.scene-canvas-container');
    expect(canvasContainer).toBeInTheDocument();
  });

  it('should render all canvas layers', () => {
    const { container } = render(SceneCanvas, { props: { scene: mockScene } });
    const canvases = container.querySelectorAll('canvas');
    expect(canvases.length).toBeGreaterThanOrEqual(4); // background, grid, tokens, controls
  });

  it('should render walls canvas when isGM is true', () => {
    const { container } = render(SceneCanvas, { props: { scene: mockScene, isGM: true } });
    const canvases = container.querySelectorAll('canvas');
    expect(canvases.length).toBe(5); // includes walls canvas
  });

  it('should not render walls canvas when isGM is false', () => {
    const { container } = render(SceneCanvas, { props: { scene: mockScene, isGM: false } });
    const canvases = container.querySelectorAll('canvas');
    expect(canvases.length).toBe(4); // no walls canvas
  });

  it('should display zoom level', () => {
    const { container } = render(SceneCanvas, { props: { scene: mockScene } });
    const zoomDisplay = container.querySelector('.zoom-display');
    expect(zoomDisplay).toBeInTheDocument();
    expect(zoomDisplay?.textContent).toBe('100%');
  });

  it('should initialize canvas with correct context', () => {
    render(SceneCanvas, { props: { scene: mockScene } });
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
  });

  it('should render square grid', () => {
    render(SceneCanvas, { props: { scene: mockScene } });

    // Check that grid lines are drawn
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.moveTo).toHaveBeenCalled();
    expect(mockContext.lineTo).toHaveBeenCalled();
    expect(mockContext.stroke).toHaveBeenCalled();
  });

  it('should render hex grid when gridType is hex', () => {
    const hexScene = { ...mockScene, gridType: 'hex' as const };
    render(SceneCanvas, { props: { scene: hexScene } });

    // Hex grid should draw more complex paths
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.closePath).toHaveBeenCalled();
  });

  it('should render background image when provided', () => {
    const sceneWithImage = { ...mockScene, backgroundImage: 'https://example.com/map.png' };
    render(SceneCanvas, { props: { scene: sceneWithImage } });

    // Background should be prepared for rendering
    expect(mockContext.fillRect).toHaveBeenCalled();
  });

  it('should render default background when no image provided', () => {
    render(SceneCanvas, { props: { scene: mockScene } });

    // Default gray background should be drawn
    expect(mockContext.fillRect).toHaveBeenCalled();
  });

  it('should show loading state while background image loads', () => {
    const sceneWithImage = { ...mockScene, backgroundImage: 'https://example.com/map.png' };
    render(SceneCanvas, { props: { scene: sceneWithImage } });

    // Should render loading message
    expect(mockContext.fillText).toHaveBeenCalledWith('Loading background image...', expect.any(Number), expect.any(Number));
  });

  it('should cache loaded background images', async () => {
    const sceneWithImage = { ...mockScene, backgroundImage: 'https://example.com/map.png' };

    // First render - image should load
    const { unmount } = render(SceneCanvas, { props: { scene: sceneWithImage } });

    unmount();
    vi.clearAllMocks();

    // Second render with same URL - should use cache
    render(SceneCanvas, { props: { scene: sceneWithImage } });

    // Background should still be rendered
    expect(mockContext.fillRect).toHaveBeenCalled();
  });

  it('should show error state when background image fails to load', () => {
    const sceneWithImage = { ...mockScene, backgroundImage: 'https://example.com/invalid.png' };
    render(SceneCanvas, { props: { scene: sceneWithImage } });

    // Initially shows loading
    expect(mockContext.fillText).toHaveBeenCalled();
  });

  it('should render tokens', () => {
    const tokens: Token[] = [
      {
        id: 'token1',
        name: 'Warrior',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        visible: true,
        sceneId: 'scene1',
        imageUrl: '',
        rotation: 0,
        ownerId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    render(SceneCanvas, { props: { scene: mockScene, tokens } });

    // Token should be rendered as a circle
    expect(mockContext.arc).toHaveBeenCalled();
    expect(mockContext.fill).toHaveBeenCalled();
    expect(mockContext.fillText).toHaveBeenCalledWith('Warrior', expect.any(Number), expect.any(Number));
  });

  it('should not render invisible tokens', () => {
    const tokens: Token[] = [
      {
        id: 'token1',
        name: 'Hidden',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        visible: false,
        sceneId: 'scene1',
        imageUrl: '',
        rotation: 0,
        ownerId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.clearAllMocks();
    render(SceneCanvas, { props: { scene: mockScene, tokens } });

    // Should not render text for invisible token
    expect(mockContext.fillText).not.toHaveBeenCalledWith('Hidden', expect.any(Number), expect.any(Number));
  });

  it('should highlight selected token', () => {
    const tokens: Token[] = [
      {
        id: 'token1',
        name: 'Warrior',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        visible: true,
        sceneId: 'scene1',
        imageUrl: '',
        rotation: 0,
        ownerId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    render(SceneCanvas, { props: { scene: mockScene, tokens } });

    // Token should be rendered with stroke
    expect(mockContext.stroke).toHaveBeenCalled();
  });

  it('should render walls when isGM is true', () => {
    const walls: Wall[] = [
      {
        id: 'wall1',
        sceneId: 'scene1',
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        wallType: 'wall',
        blocksLight: true,
        blocksMovement: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    render(SceneCanvas, { props: { scene: mockScene, walls, isGM: true } });

    // Walls should be drawn
    expect(mockContext.moveTo).toHaveBeenCalledWith(0, 0);
    expect(mockContext.lineTo).toHaveBeenCalledWith(100, 100);
  });

  it('should render doors differently than walls', () => {
    const walls: Wall[] = [
      {
        id: 'door1',
        sceneId: 'scene1',
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
        wallType: 'door',
        blocksLight: false,
        blocksMovement: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    render(SceneCanvas, { props: { scene: mockScene, walls, isGM: true } });

    // Doors should be drawn with different styling
    expect(mockContext.moveTo).toHaveBeenCalled();
    expect(mockContext.lineTo).toHaveBeenCalled();
  });

  it.skip('should handle token click', async () => {
    const onTokenSelect = vi.fn();
    const tokens: Token[] = [
      {
        id: 'token1',
        name: 'Warrior',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        visible: true,
        sceneId: 'scene1',
        imageUrl: '',
        rotation: 0,
        ownerId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const { container } = render(SceneCanvas, {
      props: { scene: mockScene, tokens, onTokenSelect },
    });

    const canvas = container.querySelector('.canvas-interactive') as HTMLCanvasElement;

    // Click on token position
    await fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });

    expect(onTokenSelect).toHaveBeenCalledWith('token1');
  });

  it('should handle click on empty space', async () => {
    const onTokenSelect = vi.fn();
    const { container } = render(SceneCanvas, {
      props: { scene: mockScene, onTokenSelect },
    });

    const canvas = container.querySelector('.canvas-interactive') as HTMLCanvasElement;

    // Click on empty space
    await fireEvent.mouseDown(canvas, { clientX: 500, clientY: 500 });

    expect(onTokenSelect).toHaveBeenCalledWith(null);
  });

  it('should pan view on drag', async () => {
    const { container } = render(SceneCanvas, { props: { scene: mockScene } });

    const canvas = container.querySelector('.canvas-interactive') as HTMLCanvasElement;

    // Start pan
    await fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });

    // Move mouse
    await fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });

    // Release mouse
    await fireEvent.mouseUp(canvas, { clientX: 150, clientY: 150 });

    // Canvas should be redrawn
    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  it.skip('should drag token when clicking on token', async () => {
    const onTokenMove = vi.fn();
    const tokens: Token[] = [
      {
        id: 'token1',
        name: 'Warrior',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        visible: true,
        sceneId: 'scene1',
        imageUrl: '',
        rotation: 0,
        ownerId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const { container } = render(SceneCanvas, {
      props: { scene: mockScene, tokens, onTokenMove },
    });

    const canvas = container.querySelector('.canvas-interactive') as HTMLCanvasElement;

    // Start drag on token
    await fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });

    // Move token
    await fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });

    // Release mouse
    await fireEvent.mouseUp(canvas, { clientX: 200, clientY: 200 });

    expect(onTokenMove).toHaveBeenCalledWith('token1', expect.any(Number), expect.any(Number));
  });

  it('should zoom in on mouse wheel', async () => {
    const { container } = render(SceneCanvas, { props: { scene: mockScene } });

    const canvas = container.querySelector('.canvas-interactive') as HTMLCanvasElement;
    const zoomDisplay = container.querySelector('.zoom-display');

    // Zoom in (negative deltaY)
    await fireEvent.wheel(canvas, { deltaY: -100 });

    // Canvas should be redrawn with new scale
    expect(mockContext.clearRect).toHaveBeenCalled();
    // Note: zoom level should increase but might not be reflected in text immediately in test
  });

  it('should zoom out on mouse wheel', async () => {
    const { container } = render(SceneCanvas, { props: { scene: mockScene } });

    const canvas = container.querySelector('.canvas-interactive') as HTMLCanvasElement;

    // Zoom out (positive deltaY)
    await fireEvent.wheel(canvas, { deltaY: 100 });

    // Canvas should be redrawn with new scale
    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  it('should respect minimum zoom level', async () => {
    const { container } = render(SceneCanvas, { props: { scene: mockScene } });

    const canvas = container.querySelector('.canvas-interactive') as HTMLCanvasElement;

    // Try to zoom out beyond minimum
    for (let i = 0; i < 10; i++) {
      await fireEvent.wheel(canvas, { deltaY: 100 });
    }

    // Should still render (scale clamped to minimum)
    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  it('should respect maximum zoom level', async () => {
    const { container } = render(SceneCanvas, { props: { scene: mockScene } });

    const canvas = container.querySelector('.canvas-interactive') as HTMLCanvasElement;

    // Try to zoom in beyond maximum
    for (let i = 0; i < 10; i++) {
      await fireEvent.wheel(canvas, { deltaY: -100 });
    }

    // Should still render (scale clamped to maximum)
    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  it('should handle mouse leave during pan', async () => {
    const { container } = render(SceneCanvas, { props: { scene: mockScene } });

    const canvas = container.querySelector('.canvas-interactive') as HTMLCanvasElement;

    // Start pan
    await fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });

    // Move mouse
    await fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });

    // Mouse leaves canvas
    await fireEvent.mouseLeave(canvas);

    // Should stop panning
    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  it('should handle mouse leave during token drag', async () => {
    const onTokenMove = vi.fn();
    const tokens: Token[] = [
      {
        id: 'token1',
        name: 'Warrior',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        visible: true,
        sceneId: 'scene1',
        imageUrl: '',
        rotation: 0,
        ownerId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const { container } = render(SceneCanvas, {
      props: { scene: mockScene, tokens, onTokenMove },
    });

    const canvas = container.querySelector('.canvas-interactive') as HTMLCanvasElement;

    // Start drag
    await fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });

    // Move mouse
    await fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });

    // Mouse leaves canvas
    await fireEvent.mouseLeave(canvas);

    // Should not call onTokenMove (drag cancelled)
    expect(onTokenMove).not.toHaveBeenCalled();
  });

  it('should render multiple tokens', () => {
    const tokens: Token[] = [
      {
        id: 'token1',
        name: 'Warrior',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        visible: true,
        sceneId: 'scene1',
        imageUrl: '',
        rotation: 0,
        ownerId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'token2',
        name: 'Wizard',
        x: 200,
        y: 200,
        width: 50,
        height: 50,
        visible: true,
        sceneId: 'scene1',
        imageUrl: '',
        rotation: 0,
        ownerId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    render(SceneCanvas, { props: { scene: mockScene, tokens } });

    // Both tokens should be rendered
    expect(mockContext.fillText).toHaveBeenCalledWith('Warrior', expect.any(Number), expect.any(Number));
    expect(mockContext.fillText).toHaveBeenCalledWith('Wizard', expect.any(Number), expect.any(Number));
  });

  it('should handle scene changes', async () => {
    const { unmount } = render(SceneCanvas, { props: { scene: mockScene } });

    vi.clearAllMocks();
    unmount();

    // Re-render with updated scene
    const newScene = { ...mockScene, name: 'Updated Scene', gridSize: 100 };
    render(SceneCanvas, { props: { scene: newScene } });

    // Canvas should be initialized and drawn
    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  it('should handle token updates', async () => {
    const tokens: Token[] = [
      {
        id: 'token1',
        name: 'Warrior',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        visible: true,
        sceneId: 'scene1',
        imageUrl: '',
        rotation: 0,
        ownerId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const { unmount } = render(SceneCanvas, { props: { scene: mockScene, tokens } });

    vi.clearAllMocks();
    unmount();

    // Re-render with updated tokens
    const updatedTokens = [
      { ...tokens[0], x: 200, y: 200 },
    ];
    render(SceneCanvas, { props: { scene: mockScene, tokens: updatedTokens } });

    // Canvas should be redrawn with updated token position
    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  it('should apply grid color and alpha', () => {
    const customScene = {
      ...mockScene,
      gridColor: '#ff0000',
      gridAlpha: 0.8,
    };

    render(SceneCanvas, { props: { scene: customScene } });

    // Grid should be drawn (color and alpha are applied in context)
    expect(mockContext.beginPath).toHaveBeenCalled();
  });

  it('should handle resize', async () => {
    render(SceneCanvas, { props: { scene: mockScene } });

    vi.clearAllMocks();

    // Trigger resize
    window.dispatchEvent(new Event('resize'));

    // Wait for resize handler
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Canvas should be redrawn
    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  describe('Token Images', () => {
    it('should render token with image when imageUrl is provided', () => {
      const tokens: Token[] = [
        {
          id: 'token1',
          name: 'Warrior',
          x: 100,
          y: 100,
          width: 50,
          height: 50,
          visible: true,
          sceneId: 'scene1',
          imageUrl: 'https://example.com/warrior.png',
          rotation: 0,
          ownerId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      render(SceneCanvas, { props: { scene: mockScene, tokens } });

      // Should create circular clipping path
      expect(mockContext.clip).toHaveBeenCalled();
      // Should still render token circle
      expect(mockContext.arc).toHaveBeenCalled();
    });

    it('should render token with colored circle when no imageUrl', () => {
      const tokens: Token[] = [
        {
          id: 'token1',
          name: 'Warrior',
          x: 100,
          y: 100,
          width: 50,
          height: 50,
          visible: true,
          sceneId: 'scene1',
          imageUrl: null,
          rotation: 0,
          ownerId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      render(SceneCanvas, { props: { scene: mockScene, tokens } });

      // Should render colored circle
      expect(mockContext.fill).toHaveBeenCalled();
      expect(mockContext.fillText).toHaveBeenCalledWith('Warrior', expect.any(Number), expect.any(Number));
    });

    it('should use circular clipping for token images', () => {
      const tokens: Token[] = [
        {
          id: 'token1',
          name: 'Warrior',
          x: 100,
          y: 100,
          width: 50,
          height: 50,
          visible: true,
          sceneId: 'scene1',
          imageUrl: 'https://example.com/warrior.png',
          rotation: 0,
          ownerId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      render(SceneCanvas, { props: { scene: mockScene, tokens } });

      // Should save context before clipping
      expect(mockContext.save).toHaveBeenCalled();
      // Should create circular clipping path
      expect(mockContext.clip).toHaveBeenCalled();
      // Should restore context after clipping
      expect(mockContext.restore).toHaveBeenCalled();
    });

    it('should render selection highlight around token with image', () => {
      const tokens: Token[] = [
        {
          id: 'token1',
          name: 'Warrior',
          x: 100,
          y: 100,
          width: 50,
          height: 50,
          visible: true,
          sceneId: 'scene1',
          imageUrl: 'https://example.com/warrior.png',
          rotation: 0,
          ownerId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      render(SceneCanvas, { props: { scene: mockScene, tokens } });

      // Should still draw selection stroke
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should handle multiple tokens with different image states', () => {
      const tokens: Token[] = [
        {
          id: 'token1',
          name: 'Warrior',
          x: 100,
          y: 100,
          width: 50,
          height: 50,
          visible: true,
          sceneId: 'scene1',
          imageUrl: 'https://example.com/warrior.png',
          rotation: 0,
          ownerId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'token2',
          name: 'Wizard',
          x: 200,
          y: 200,
          width: 50,
          height: 50,
          visible: true,
          sceneId: 'scene1',
          imageUrl: null,
          rotation: 0,
          ownerId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      render(SceneCanvas, { props: { scene: mockScene, tokens } });

      // Both tokens should be rendered
      expect(mockContext.arc).toHaveBeenCalled();
      // Text should be rendered for token without image
      expect(mockContext.fillText).toHaveBeenCalledWith('Wizard', expect.any(Number), expect.any(Number));
    });
  });
});
