<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  // Props
  export let x: number;
  export let y: number;
  export let elementType: 'token' | 'light' | 'wall' | 'window' | 'door' | 'pathpoint';
  export let elementId: string;
  export let isGM: boolean = false;
  export let isVisible: boolean = true;
  export let snapToGrid: boolean = true;
  export let wallShape: 'straight' | 'curved' | undefined = undefined;
  export let clickWorldPos: { x: number; y: number } | undefined = undefined;
  export let controlPointIndex: number | null = null;

  const dispatch = createEventDispatcher<{
    edit: void;
    possess: void;
    toggleVisibility: { currentState: boolean };
    toggleSnapToGrid: { currentState: boolean };
    addSplinePoint: { worldPos: { x: number; y: number } };
    deleteSplinePoint: { controlPointIndex: number };
    editPathName: void;
    editPathIndex: void;
    delete: void;
    close: void;
  }>();

  let menuElement: HTMLDivElement;
  let menuX = x;
  let menuY = y;

  // Adjust position to keep menu on screen
  onMount(() => {
    if (menuElement) {
      const rect = menuElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Adjust horizontal position if menu goes off right edge
      if (menuX + rect.width > viewportWidth) {
        menuX = viewportWidth - rect.width - 10;
      }

      // Adjust vertical position if menu goes off bottom edge
      if (menuY + rect.height > viewportHeight) {
        menuY = viewportHeight - rect.height - 10;
      }

      // Ensure menu doesn't go off left edge
      if (menuX < 10) {
        menuX = 10;
      }

      // Ensure menu doesn't go off top edge
      if (menuY < 10) {
        menuY = 10;
      }
    }

    // Add event listeners - listen for both click and mousedown to catch canvas interactions
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
  });

  onDestroy(() => {
    // Remove event listeners
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('keydown', handleKeyDown);
  });

  function handleClickOutside(event: MouseEvent) {
    // Use setTimeout to allow the menu's own click handlers to fire first
    setTimeout(() => {
      if (menuElement && !menuElement.contains(event.target as Node)) {
        close();
      }
    }, 0);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      close();
    }
  }

  function handleEdit() {
    dispatch('edit');
    close();
  }

  function handlePossess() {
    dispatch('possess');
    close();
  }

  function handleToggleVisibility() {
    dispatch('toggleVisibility', { currentState: isVisible });
    close();
  }

  function handleToggleSnapToGrid() {
    dispatch('toggleSnapToGrid', { currentState: snapToGrid });
    close();
  }

  function handleDelete() {
    dispatch('delete');
    close();
  }

  function handleAddSplinePoint() {
    if (clickWorldPos) {
      dispatch('addSplinePoint', { worldPos: clickWorldPos });
      close();
    }
  }

  function handleDeleteSplinePoint() {
    if (controlPointIndex !== null) {
      dispatch('deleteSplinePoint', { controlPointIndex });
      close();
    }
  }

  function handleEditPathName() {
    dispatch('editPathName');
    close();
  }

  function handleEditPathIndex() {
    dispatch('editPathIndex');
    close();
  }

  function close() {
    // Dispatch close event to parent using Svelte's event system
    dispatch('close');
  }
</script>

<div
  class="context-menu"
  bind:this={menuElement}
  style="left: {menuX}px; top: {menuY}px;"
  on:click|stopPropagation
>
  <!-- Edit Properties -->
  <button class="menu-item" on:click={handleEdit}>
    <span class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
    </span>
    <span>Edit Properties</span>
  </button>

  <!-- Possess Token (GM only, tokens only) -->
  {#if isGM && elementType === 'token'}
    <button class="menu-item" on:click={handlePossess}>
      <span class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </span>
      <span>Possess Token</span>
    </button>
  {/if}

  <div class="separator"></div>

  <!-- Toggle Visibility -->
  <button class="menu-item" on:click={handleToggleVisibility}>
    <span class="icon">
      {#if isVisible}
        <!-- Eye-off icon (make invisible) -->
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      {:else}
        <!-- Eye icon (make visible) -->
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      {/if}
    </span>
    <span>{isVisible ? 'Make Invisible' : 'Make Visible'}</span>
  </button>

  <!-- Toggle Snap to Grid (walls, windows, and doors) -->
  {#if elementType === 'wall' || elementType === 'window' || elementType === 'door'}
    <button class="menu-item" on:click={handleToggleSnapToGrid}>
      <span class="icon">
        {#if snapToGrid}
          <!-- Grid icon with checkmark -->
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        {:else}
          <!-- Grid icon without checkmark -->
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        {/if}
      </span>
      <span>{snapToGrid ? 'Disable' : 'Enable'} Snap to Grid</span>
    </button>
  {/if}

  <!-- Add Spline Point (curved walls, windows, and doors) -->
  {#if (elementType === 'wall' || elementType === 'window' || elementType === 'door') && wallShape === 'curved' && controlPointIndex === null}
    <button class="menu-item" on:click={handleAddSplinePoint}>
      <span class="icon">
        <!-- Plus icon for adding a point -->
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
      </span>
      <span>Add Spline Point</span>
    </button>
  {/if}

  <!-- Delete Spline Point (curved walls, windows, and doors, when clicking on a control point) -->
  {#if (elementType === 'wall' || elementType === 'window' || elementType === 'door') && wallShape === 'curved' && controlPointIndex !== null}
    <button class="menu-item danger" on:click={handleDeleteSplinePoint}>
      <span class="icon">
        <!-- Trash icon for deleting a point -->
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </span>
      <span>Delete Spline Point</span>
    </button>
  {/if}

  <!-- Edit Path Name (path points only) -->
  {#if elementType === 'pathpoint'}
    <button class="menu-item" on:click={handleEditPathName}>
      <span class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </span>
      <span>Edit Path Name</span>
    </button>

    <button class="menu-item" on:click={handleEditPathIndex}>
      <span class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </span>
      <span>Edit Path Index</span>
    </button>
  {/if}

  <!-- Delete (GM only for some element types, or always show based on requirements) -->
  {#if isGM}
    <button class="menu-item danger" on:click={handleDelete}>
      <span class="icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </span>
      <span>Delete</span>
    </button>
  {/if}
</div>

<style>
  .context-menu {
    position: fixed;
    background: var(--color-bg-secondary, #2d2d2d);
    border: 1px solid var(--color-border, #404040);
    border-radius: 0.375rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    min-width: 180px;
    padding: 0.25rem 0;
    z-index: 1001;
    user-select: none;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 1rem;
    width: 100%;
    cursor: pointer;
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
    background: none;
    border: none;
    text-align: left;
    transition: background-color 0.15s ease;
  }

  .menu-item:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .menu-item.danger {
    color: #ef4444;
  }

  .menu-item.danger:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .separator {
    height: 1px;
    background: var(--color-border, #404040);
    margin: 0.25rem 0;
  }

  /* Animation on appear */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .context-menu {
    animation: fadeIn 0.1s ease-out;
  }
</style>
