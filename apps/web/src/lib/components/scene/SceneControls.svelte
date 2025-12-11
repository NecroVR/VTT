<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import ToolButton from './ToolButton.svelte';

  // Props
  export let isGM: boolean = false;
  export let orientation: 'vertical' | 'horizontal' = 'vertical';
  export let activeTool: string = 'select';
  export let onToolChange: ((tool: string) => void) | undefined = undefined;

  // Available tools
  const tools = [
    { id: 'select', label: 'Select', icon: '⬆', gmOnly: false, shortcut: '1' },
    { id: 'wall', label: 'Wall', icon: '▬', gmOnly: true, shortcut: '2' },
    { id: 'curved-wall', label: 'Curved Wall', icon: '⌒', gmOnly: true, shortcut: 'c' },
    { id: 'door', label: 'Door', icon: '🚪', gmOnly: true, shortcut: 'd' },
    { id: 'curved-door', label: 'Curved Door', icon: '⌓', gmOnly: true, shortcut: 'shift+d' },
    { id: 'window', label: 'Window', icon: '🪟', gmOnly: true, shortcut: 'w' },
    { id: 'curved-window', label: 'Curved Window', icon: '⌓', gmOnly: true, shortcut: 'shift+w' },
    { id: 'path', label: 'Path', icon: '〰', gmOnly: true, shortcut: 'a' },
    { id: 'light', label: 'Light', icon: '💡', gmOnly: true, shortcut: '3' },
    { id: 'tile', label: 'Tile', icon: '🖼', gmOnly: true, shortcut: 't' },
    { id: 'region', label: 'Region', icon: '🔷', gmOnly: true, shortcut: 'r' },
    { id: 'pin', label: 'Pin', icon: '📍', gmOnly: false, shortcut: 'p' },
    { id: 'ruler', label: 'Ruler', icon: '📏', gmOnly: false, shortcut: '4' },
    { id: 'template', label: 'Template', icon: '⭕', gmOnly: false, shortcut: '5' },
    { id: 'freehand', label: 'Freehand', icon: '✏', gmOnly: false, shortcut: '6' },
    { id: 'rectangle', label: 'Rectangle', icon: '▭', gmOnly: false, shortcut: '7' },
    { id: 'circle', label: 'Circle', icon: '◯', gmOnly: false, shortcut: '8' },
    { id: 'text', label: 'Text', icon: '📝', gmOnly: false, shortcut: '9' },
  ];

  function handleToolClick(toolId: string) {
    activeTool = toolId;
    onToolChange?.(toolId);
  }

  function handleKeyDown(e: KeyboardEvent) {
    // Check if user is typing in an input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    // Check for tool shortcuts
    const key = e.key.toLowerCase();

    // Handle shift+key combinations
    const shortcutKey = e.shiftKey ? `shift+${key}` : key;

    const tool = tools.find(t => t.shortcut === shortcutKey);

    if (tool && (isGM || !tool.gmOnly)) {
      e.preventDefault();
      handleToolClick(tool.id);
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<div class="scene-controls" class:horizontal={orientation === 'horizontal'}>
  <div class="tools-container">
    {#each tools as tool (tool.id)}
      <ToolButton
        tool={tool.id}
        label={tool.label}
        icon={tool.icon}
        active={activeTool === tool.id}
        visible={isGM || !tool.gmOnly}
        onClick={() => handleToolClick(tool.id)}
      />
    {/each}
  </div>
</div>

<style>
  .scene-controls {
    display: flex;
    flex-direction: column;
    background-color: rgba(17, 24, 39, 0.9);
    border: 1px solid #374151;
    border-radius: 0.5rem;
    padding: 0.5rem;
    gap: 0.5rem;
    backdrop-filter: blur(8px);
  }

  .scene-controls.horizontal {
    flex-direction: row;
  }

  .tools-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .scene-controls.horizontal .tools-container {
    flex-direction: row;
  }
</style>
