<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import ToolButton from './ToolButton.svelte';

  // Props
  export let isGM: boolean = false;
  export let orientation: 'vertical' | 'horizontal' = 'vertical';
  export let activeTool: string = 'select';
  export let onToolChange: ((tool: string) => void) | undefined = undefined;
  export let propertiesContent: any = null;

  // Available tools
  const tools = [
    { id: 'select', label: 'Select', icon: '⬆', gmOnly: false, shortcut: '1' },
    { id: 'wall', label: 'Wall', icon: '⌒', gmOnly: true, shortcut: '2' },
    { id: 'door', label: 'Door', icon: '🚪', gmOnly: true, shortcut: 'd' },
    { id: 'window', label: 'Window', icon: '🪟', gmOnly: true, shortcut: 'w' },
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
  <!-- Tools Section -->
  <div class="tools-section">
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

  <!-- Divider -->
  <div class="divider"></div>

  <!-- Properties Section -->
  <div class="properties-section">
    <div class="properties-header">
      <span class="properties-label">Properties</span>
    </div>
    <div class="properties-content">
      <slot name="properties">
        {#if propertiesContent}
          {@html propertiesContent}
        {:else}
          <div class="properties-placeholder">
            <span>No selection</span>
          </div>
        {/if}
      </slot>
    </div>
  </div>
</div>

<style>
  .scene-controls {
    display: flex;
    flex-direction: column;
    background-color: transparent;
    padding: 0;
    height: 100%;
    overflow: hidden;
  }

  .scene-controls.horizontal {
    flex-direction: row;
  }

  /* Tools Section */
  .tools-section {
    flex-shrink: 0;
    min-height: 200px;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .tools-container {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: 100%;
  }

  /* Divider */
  .divider {
    flex-shrink: 0;
    height: 1px;
    background-color: rgba(255, 255, 255, 0.1);
    margin: 0 0.5rem;
  }

  /* Properties Section */
  .properties-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
  }

  .properties-header {
    flex-shrink: 0;
    padding: 0.5rem 0.75rem;
    background-color: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .properties-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.7);
  }

  .properties-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
    min-height: 0;
  }

  .properties-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.875rem;
    font-style: italic;
  }
</style>
