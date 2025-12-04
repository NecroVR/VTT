import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SceneControls from './SceneControls.svelte';

describe('SceneControls', () => {
  beforeEach(() => {
    // Reset any event listeners between tests
    window.removeEventListener('keydown', () => {});
  });

  afterEach(() => {
    // Clean up
    window.removeEventListener('keydown', () => {});
  });

  describe('Tool Rendering', () => {
    it('should render all player-accessible tools for non-GM', () => {
      render(SceneControls, { props: { isGM: false } });

      expect(screen.getByText('Select')).toBeInTheDocument();
      expect(screen.getByText('Measure')).toBeInTheDocument();
      expect(screen.getByText('Ping')).toBeInTheDocument();
    });

    it('should not render GM-only tools for non-GM', () => {
      render(SceneControls, { props: { isGM: false } });

      expect(screen.queryByText('Wall')).not.toBeInTheDocument();
      expect(screen.queryByText('Light')).not.toBeInTheDocument();
    });

    it('should render all tools for GM', () => {
      render(SceneControls, { props: { isGM: true } });

      expect(screen.getByText('Select')).toBeInTheDocument();
      expect(screen.getByText('Wall')).toBeInTheDocument();
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Measure')).toBeInTheDocument();
      expect(screen.getByText('Ping')).toBeInTheDocument();
    });

    it('should render tools with correct icons', () => {
      render(SceneControls, { props: { isGM: true } });

      expect(screen.getByText('⬆')).toBeInTheDocument(); // Select
      expect(screen.getByText('▬')).toBeInTheDocument(); // Wall
      expect(screen.getByText('💡')).toBeInTheDocument(); // Light
      expect(screen.getByText('📏')).toBeInTheDocument(); // Measure
      expect(screen.getByText('📍')).toBeInTheDocument(); // Ping
    });
  });

  describe('Tool Selection', () => {
    it('should mark Select tool as active by default', () => {
      render(SceneControls, { props: { isGM: false } });

      const selectButton = screen.getByText('Select').closest('button');
      expect(selectButton).toHaveClass('active');
    });

    it('should mark provided activeTool as active', () => {
      render(SceneControls, { props: { isGM: false, activeTool: 'measure' } });

      const measureButton = screen.getByText('Measure').closest('button');
      expect(measureButton).toHaveClass('active');

      const selectButton = screen.getByText('Select').closest('button');
      expect(selectButton).not.toHaveClass('active');
    });

    it('should call onToolChange callback when tool is clicked', async () => {
      const onToolChange = vi.fn();
      render(SceneControls, { props: { isGM: false, onToolChange } });

      const measureButton = screen.getByText('Measure').closest('button');
      if (measureButton) {
        await fireEvent.click(measureButton);
      }

      expect(onToolChange).toHaveBeenCalledTimes(1);
      expect(onToolChange).toHaveBeenCalledWith('measure');
    });

    it('should update active tool when clicked', async () => {
      render(SceneControls, { props: { isGM: false } });

      const measureButton = screen.getByText('Measure').closest('button');
      if (measureButton) {
        await fireEvent.click(measureButton);
      }

      expect(measureButton).toHaveClass('active');

      const selectButton = screen.getByText('Select').closest('button');
      expect(selectButton).not.toHaveClass('active');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should activate Select tool when 1 is pressed', async () => {
      const onToolChange = vi.fn();
      render(SceneControls, { props: { isGM: false, activeTool: 'measure', onToolChange } });

      await fireEvent.keyDown(window, { key: '1' });

      expect(onToolChange).toHaveBeenCalledWith('select');
    });

    it('should activate Measure tool when 4 is pressed', async () => {
      const onToolChange = vi.fn();
      render(SceneControls, { props: { isGM: false, onToolChange } });

      await fireEvent.keyDown(window, { key: '4' });

      expect(onToolChange).toHaveBeenCalledWith('measure');
    });

    it('should not activate GM-only tools for non-GM players via keyboard', async () => {
      const onToolChange = vi.fn();
      render(SceneControls, { props: { isGM: false, onToolChange } });

      await fireEvent.keyDown(window, { key: '2' }); // Wall tool (GM only)

      expect(onToolChange).not.toHaveBeenCalled();
    });

    it('should activate GM-only tools for GM via keyboard', async () => {
      const onToolChange = vi.fn();
      render(SceneControls, { props: { isGM: true, onToolChange } });

      await fireEvent.keyDown(window, { key: '2' }); // Wall tool

      expect(onToolChange).toHaveBeenCalledWith('wall');
    });

    it('should not activate tools when typing in input field', async () => {
      const onToolChange = vi.fn();
      render(SceneControls, { props: { isGM: false, onToolChange } });

      // Create an input element
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      await fireEvent.keyDown(input, { key: '1' });

      expect(onToolChange).not.toHaveBeenCalled();

      // Cleanup
      document.body.removeChild(input);
    });

    it('should not activate tools when typing in textarea', async () => {
      const onToolChange = vi.fn();
      render(SceneControls, { props: { isGM: false, onToolChange } });

      // Create a textarea element
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      await fireEvent.keyDown(textarea, { key: '1' });

      expect(onToolChange).not.toHaveBeenCalled();

      // Cleanup
      document.body.removeChild(textarea);
    });
  });

  describe('Orientation', () => {
    it('should apply vertical orientation by default', () => {
      const { container } = render(SceneControls, { props: { isGM: false } });

      const controls = container.querySelector('.scene-controls');
      expect(controls).not.toHaveClass('horizontal');
    });

    it('should apply horizontal orientation when specified', () => {
      const { container } = render(SceneControls, { props: { isGM: false, orientation: 'horizontal' } });

      const controls = container.querySelector('.scene-controls');
      expect(controls).toHaveClass('horizontal');
    });
  });
});
