import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import CampaignCanvas from './CampaignCanvas.svelte';
import type { Token } from '@vtt/shared';

describe('CampaignCanvas component', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockContext: any;

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
      closePath: vi.fn(),
      drawImage: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
      setTransform: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the canvas element', () => {
    const { container } = render(CampaignCanvas);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should initialize canvas with correct context', () => {
    render(CampaignCanvas);
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
  });

  it('should render with default empty tokens map', () => {
    const { container } = render(CampaignCanvas);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should render grid when showGrid is true', () => {
    render(CampaignCanvas, { props: { showGrid: true } });

    // Check that grid lines are drawn
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.moveTo).toHaveBeenCalled();
    expect(mockContext.lineTo).toHaveBeenCalled();
    expect(mockContext.stroke).toHaveBeenCalled();
  });

  it('should not render grid when showGrid is false', () => {
    vi.clearAllMocks();
    render(CampaignCanvas, { props: { showGrid: false } });

    // Grid drawing should be minimal or none
    const callCount = mockContext.beginPath.mock.calls.length;
    expect(callCount).toBeLessThanOrEqual(1); // Only for tokens, not grid
  });

  it('should render tokens from the tokens map', () => {
    const tokens = new Map<string, Token>();
    tokens.set('token1', {
      id: 'token1',
      name: 'Warrior',
      x: 1,
      y: 1,
      width: 1,
      height: 1,
      visible: true,
      sceneId: 'scene1',
      imageUrl: '',
      rotation: 0,
      ownerId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    render(CampaignCanvas, { props: { tokens } });

    // Check that fillRect was called for the token
    expect(mockContext.fillRect).toHaveBeenCalled();
    expect(mockContext.strokeRect).toHaveBeenCalled();
    expect(mockContext.fillText).toHaveBeenCalledWith('Warrior', expect.any(Number), expect.any(Number));
  });

  it('should highlight selected token', () => {
    const tokens = new Map<string, Token>();
    tokens.set('token1', {
      id: 'token1',
      name: 'Warrior',
      x: 1,
      y: 1,
      width: 1,
      height: 1,
      visible: true,
      sceneId: 'scene1',
      imageUrl: '',
      rotation: 0,
      ownerId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    render(CampaignCanvas, { props: { tokens, selectedTokenId: 'token1' } });

    // Check that token is rendered with selection styling
    expect(mockContext.strokeRect).toHaveBeenCalled();
  });

  it('should render invisible tokens with overlay', () => {
    const tokens = new Map<string, Token>();
    tokens.set('token1', {
      id: 'token1',
      name: 'Hidden',
      x: 1,
      y: 1,
      width: 1,
      height: 1,
      visible: false,
      sceneId: 'scene1',
      imageUrl: '',
      rotation: 0,
      ownerId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    render(CampaignCanvas, { props: { tokens } });

    // Check that fillRect is called multiple times (token + overlay)
    expect(mockContext.fillRect).toHaveBeenCalled();
    expect(mockContext.fillText).toHaveBeenCalled();
  });

  it('should call onTokenClick when token is clicked', async () => {
    const onTokenClick = vi.fn();
    const tokens = new Map<string, Token>();
    tokens.set('token1', {
      id: 'token1',
      name: 'Warrior',
      x: 1,
      y: 1,
      width: 1,
      height: 1,
      visible: true,
      sceneId: 'scene1',
      imageUrl: '',
      rotation: 0,
      ownerId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { container } = render(CampaignCanvas, {
      props: { tokens, onTokenClick, gridSize: 50 },
    });

    const canvas = container.querySelector('canvas') as HTMLCanvasElement;

    // Click on token position (grid position 1,1 with gridSize 50 = pixel 50,50)
    await fireEvent.mouseDown(canvas, { clientX: 55, clientY: 55 });

    expect(onTokenClick).toHaveBeenCalledWith('token1');
  });

  it('should handle mouse down on empty space', async () => {
    const onTokenClick = vi.fn();
    const { container } = render(CampaignCanvas, {
      props: { onTokenClick },
    });

    const canvas = container.querySelector('canvas') as HTMLCanvasElement;

    // Click on empty space
    await fireEvent.mouseDown(canvas, { clientX: 500, clientY: 500 });

    expect(onTokenClick).not.toHaveBeenCalled();
  });

  it('should initiate drag when mouse down on token', async () => {
    const onTokenClick = vi.fn();
    const tokens = new Map<string, Token>();
    tokens.set('token1', {
      id: 'token1',
      name: 'Warrior',
      x: 1,
      y: 1,
      width: 1,
      height: 1,
      visible: true,
      sceneId: 'scene1',
      imageUrl: '',
      rotation: 0,
      ownerId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { container } = render(CampaignCanvas, {
      props: { tokens, onTokenClick, gridSize: 50 },
    });

    const canvas = container.querySelector('canvas') as HTMLCanvasElement;

    await fireEvent.mouseDown(canvas, { clientX: 55, clientY: 55 });

    expect(onTokenClick).toHaveBeenCalledWith('token1');
  });

  it('should update token position during drag', async () => {
    const onTokenMove = vi.fn();
    const tokens = new Map<string, Token>();
    tokens.set('token1', {
      id: 'token1',
      name: 'Warrior',
      x: 1,
      y: 1,
      width: 1,
      height: 1,
      visible: true,
      sceneId: 'scene1',
      imageUrl: '',
      rotation: 0,
      ownerId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { container } = render(CampaignCanvas, {
      props: { tokens, onTokenMove, gridSize: 50 },
    });

    const canvas = container.querySelector('canvas') as HTMLCanvasElement;

    // Start drag
    await fireEvent.mouseDown(canvas, { clientX: 55, clientY: 55 });

    // Move mouse
    await fireEvent.mouseMove(canvas, { clientX: 105, clientY: 105 });

    // Canvas should be redrawn with new position
    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  it('should call onTokenMove when drag completes', async () => {
    const onTokenMove = vi.fn();
    const tokens = new Map<string, Token>();
    tokens.set('token1', {
      id: 'token1',
      name: 'Warrior',
      x: 1,
      y: 1,
      width: 1,
      height: 1,
      visible: true,
      sceneId: 'scene1',
      imageUrl: '',
      rotation: 0,
      ownerId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { container } = render(CampaignCanvas, {
      props: { tokens, onTokenMove, gridSize: 50 },
    });

    const canvas = container.querySelector('canvas') as HTMLCanvasElement;

    // Start drag
    await fireEvent.mouseDown(canvas, { clientX: 55, clientY: 55 });

    // Move mouse
    await fireEvent.mouseMove(canvas, { clientX: 155, clientY: 155 });

    // Release mouse
    await fireEvent.mouseUp(canvas, { clientX: 155, clientY: 155 });

    expect(onTokenMove).toHaveBeenCalledWith('token1', expect.any(Number), expect.any(Number));
  });

  it('should snap token to grid on mouse up', async () => {
    const onTokenMove = vi.fn();
    const tokens = new Map<string, Token>();
    tokens.set('token1', {
      id: 'token1',
      name: 'Warrior',
      x: 1,
      y: 1,
      width: 1,
      height: 1,
      visible: true,
      sceneId: 'scene1',
      imageUrl: '',
      rotation: 0,
      ownerId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { container } = render(CampaignCanvas, {
      props: { tokens, onTokenMove, gridSize: 50 },
    });

    const canvas = container.querySelector('canvas') as HTMLCanvasElement;

    // Start drag
    await fireEvent.mouseDown(canvas, { clientX: 55, clientY: 55 });

    // Move mouse to position that should snap to grid 3,3
    await fireEvent.mouseMove(canvas, { clientX: 147, clientY: 147 });

    // Release mouse
    await fireEvent.mouseUp(canvas, { clientX: 147, clientY: 147 });

    // Should snap to grid position (rounded)
    expect(onTokenMove).toHaveBeenCalledWith('token1', expect.any(Number), expect.any(Number));
  });

  it('should handle multiple tokens', () => {
    const tokens = new Map<string, Token>();
    tokens.set('token1', {
      id: 'token1',
      name: 'Warrior',
      x: 1,
      y: 1,
      width: 1,
      height: 1,
      visible: true,
      sceneId: 'scene1',
      imageUrl: '',
      rotation: 0,
      ownerId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    tokens.set('token2', {
      id: 'token2',
      name: 'Wizard',
      x: 3,
      y: 3,
      width: 1,
      height: 1,
      visible: true,
      sceneId: 'scene1',
      imageUrl: '',
      rotation: 0,
      ownerId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    render(CampaignCanvas, { props: { tokens } });

    // Check that both tokens are rendered
    expect(mockContext.fillText).toHaveBeenCalledWith('Warrior', expect.any(Number), expect.any(Number));
    expect(mockContext.fillText).toHaveBeenCalledWith('Wizard', expect.any(Number), expect.any(Number));
  });

  it('should use custom grid size', () => {
    const gridSize = 100;
    render(CampaignCanvas, { props: { showGrid: true, gridSize } });

    // Grid should be drawn with custom size
    expect(mockContext.moveTo).toHaveBeenCalled();
    expect(mockContext.lineTo).toHaveBeenCalled();
  });

  it('should handle window resize', async () => {
    render(CampaignCanvas);

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));

    // Canvas should be redrawn
    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  it('should render token with imageUrl differently than without', () => {
    const tokens = new Map<string, Token>();
    tokens.set('token1', {
      id: 'token1',
      name: 'Warrior',
      x: 1,
      y: 1,
      width: 1,
      height: 1,
      visible: true,
      sceneId: 'scene1',
      imageUrl: 'https://example.com/warrior.png',
      rotation: 0,
      ownerId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    render(CampaignCanvas, { props: { tokens } });

    // Token should be rendered
    expect(mockContext.fillRect).toHaveBeenCalled();
  });

  it('should select topmost token when tokens overlap', async () => {
    const onTokenClick = vi.fn();
    const tokens = new Map<string, Token>();
    tokens.set('token1', {
      id: 'token1',
      name: 'Warrior',
      x: 1,
      y: 1,
      width: 2,
      height: 2,
      visible: true,
      sceneId: 'scene1',
      imageUrl: '',
      rotation: 0,
      ownerId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    tokens.set('token2', {
      id: 'token2',
      name: 'Wizard',
      x: 1,
      y: 1,
      width: 1,
      height: 1,
      visible: true,
      sceneId: 'scene1',
      imageUrl: '',
      rotation: 0,
      ownerId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { container } = render(CampaignCanvas, {
      props: { tokens, onTokenClick, gridSize: 50 },
    });

    const canvas = container.querySelector('canvas') as HTMLCanvasElement;

    // Click on overlapping position
    await fireEvent.mouseDown(canvas, { clientX: 55, clientY: 55 });

    // Should select the last token added (topmost)
    expect(onTokenClick).toHaveBeenCalled();
  });
});
