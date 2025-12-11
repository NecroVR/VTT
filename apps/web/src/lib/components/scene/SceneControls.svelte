<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import ToolButton from './ToolButton.svelte';
  import ToolGroup from './ToolGroup.svelte';
  import { toolbarStore, type EditorMode } from '$lib/stores/toolbar';

  const dispatch = createEventDispatcher();

  // Props
  export let isGM: boolean = false;
  export let orientation: 'vertical' | 'horizontal' = 'vertical';
  export let activeTool: string = 'select';
  export let onToolChange: ((tool: string) => void) | undefined = undefined;
  export let propertiesContent: any = null;

  // Subscribe to toolbar store
  $: editorMode = $toolbarStore.editorMode;

  // Tool definition type
  type Tool = {
    id: string;
    label: string;
    icon: string;
    gmOnly: boolean;
    shortcut: string;
  };

  // Tool group definition type
  type ToolGroupDef = {
    id: string;
    label: string;
    icon: string;
    gmOnly: boolean;
    tools: Tool[];
  };

  // Standalone tools (not in a group)
  const standAloneTools: Tool[] = [
    { id: 'select', label: 'Select', icon: '⬆', gmOnly: false, shortcut: '1' },
  ];

  // Grouped tools
  const toolGroups: ToolGroupDef[] = [
    {
      id: 'architecture',
      label: 'Architecture',
      icon: '🏛',
      gmOnly: true,
      tools: [
        { id: 'wall', label: 'Wall', icon: '⌒', gmOnly: true, shortcut: '2' },
        { id: 'door', label: 'Door', icon: '🚪', gmOnly: true, shortcut: 'd' },
        { id: 'window', label: 'Window', icon: '🪟', gmOnly: true, shortcut: 'w' },
        { id: 'light', label: 'Light', icon: '💡', gmOnly: true, shortcut: '3' },
      ],
    },
    {
      id: 'sceneSetup',
      label: 'Scene Setup',
      icon: '🗺',
      gmOnly: true,
      tools: [
        { id: 'tile', label: 'Tile', icon: '🖼', gmOnly: true, shortcut: 't' },
        { id: 'region', label: 'Region', icon: '🔷', gmOnly: true, shortcut: 'r' },
        { id: 'path', label: 'Path', icon: '〰', gmOnly: true, shortcut: 'a' },
      ],
    },
    {
      id: 'draw',
      label: 'Draw',
      icon: '✏',
      gmOnly: false,
      tools: [
        { id: 'freehand', label: 'Freehand', icon: '✏', gmOnly: false, shortcut: '6' },
        { id: 'rectangle', label: 'Rectangle', icon: '▭', gmOnly: false, shortcut: '7' },
        { id: 'circle', label: 'Circle', icon: '◯', gmOnly: false, shortcut: '8' },
        { id: 'text', label: 'Text', icon: '📝', gmOnly: false, shortcut: '9' },
        { id: 'pin', label: 'Pin', icon: '📍', gmOnly: false, shortcut: 'p' },
      ],
    },
  ];

  // Uncategorized tools (will be categorized later)
  const uncategorizedTools: Tool[] = [];

  // Flatten all tools for keyboard shortcut lookup
  const allTools: Tool[] = [
    ...standAloneTools,
    ...toolGroups.flatMap(g => g.tools),
    ...uncategorizedTools,
  ];

  // Track expanded state for each group
  let expandedGroups: Record<string, boolean> = {
    architecture: true,
    sceneSetup: true,
    draw: true,
  };

  // Check if a group contains the active tool
  function groupHasActiveTool(group: ToolGroupDef): boolean {
    return group.tools.some(t => t.id === activeTool);
  }

  // Check if group should be visible based on GM status
  function isGroupVisible(group: ToolGroupDef): boolean {
    if (!group.gmOnly) return true;
    return isGM;
  }

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

    const tool = allTools.find(t => t.shortcut === shortcutKey);

    if (tool && (isGM || !tool.gmOnly)) {
      e.preventDefault();
      handleToolClick(tool.id);
    }
  }

  function handleModeChange(mode: EditorMode) {
    toolbarStore.setEditorMode(mode);
    dispatch('modeChange', mode);
  }

  function handleCollapse() {
    toolbarStore.toggleCollapse();
    dispatch('collapse');
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<div class="scene-controls" class:horizontal={orientation === 'horizontal'}>
  <!-- Mode Toggle Section -->
  <div class="mode-section">
    <div class="mode-toggle">
      <button
        class="mode-button"
        class:active={editorMode === 'edit'}
        on:click={() => handleModeChange('edit')}
        type="button"
        title="Edit Mode - Setup and modify the scene"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        <span class="mode-label">Edit</span>
      </button>
      <button
        class="mode-button"
        class:active={editorMode === 'play'}
        on:click={() => handleModeChange('play')}
        type="button"
        title="Play Mode - Active gameplay"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <span class="mode-label">Play</span>
      </button>
    </div>
    <button
      class="collapse-button"
      on:click={handleCollapse}
      type="button"
      title="Collapse toolbar"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  </div>

  <!-- Divider -->
  <div class="section-divider"></div>

  <!-- Tools Section -->
  <div class="tools-section">
    <div class="tools-container">
      <!-- Standalone tools (Select, etc.) -->
      {#each standAloneTools as tool (tool.id)}
        <ToolButton
          tool={tool.id}
          label={tool.label}
          icon={tool.icon}
          active={activeTool === tool.id}
          visible={isGM || !tool.gmOnly}
          onClick={() => handleToolClick(tool.id)}
        />
      {/each}

      <!-- Tool Groups -->
      {#each toolGroups as group (group.id)}
        {#if isGroupVisible(group)}
          <ToolGroup
            label={group.label}
            icon={group.icon}
            bind:expanded={expandedGroups[group.id]}
            hasActiveTool={groupHasActiveTool(group)}
          >
            {#each group.tools as tool (tool.id)}
              <ToolButton
                tool={tool.id}
                label={tool.label}
                icon={tool.icon}
                active={activeTool === tool.id}
                visible={isGM || !tool.gmOnly}
                onClick={() => handleToolClick(tool.id)}
              />
            {/each}
          </ToolGroup>
        {/if}
      {/each}

      <!-- Uncategorized tools -->
      {#each uncategorizedTools as tool (tool.id)}
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
    width: 100%;
    overflow: hidden;
  }

  .scene-controls.horizontal {
    flex-direction: row;
  }

  /* Mode Section */
  .mode-section {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
    background-color: rgba(0, 0, 0, 0.2);
  }

  .mode-toggle {
    display: flex;
    gap: 0.25rem;
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 0.375rem;
    padding: 0.25rem;
  }

  .mode-button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    border: none;
    border-radius: 0.25rem;
    background-color: transparent;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .mode-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
  }

  .mode-button.active {
    background-color: #3b82f6;
    color: white;
  }

  .mode-button.active:hover {
    background-color: #2563eb;
  }

  .mode-label {
    display: inline;
  }

  .collapse-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    border: none;
    border-radius: 0.25rem;
    background-color: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .collapse-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }

  /* Section Divider */
  .section-divider {
    flex-shrink: 0;
    height: 1px;
    background-color: rgba(255, 255, 255, 0.1);
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
