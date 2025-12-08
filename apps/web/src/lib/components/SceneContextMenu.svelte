<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  // Props
  export let x: number;
  export let y: number;
  export let elementType: 'token' | 'light' | 'wall';
  export let elementId: string;
  export let isGM: boolean = false;
  export let isVisible: boolean = true;

  const dispatch = createEventDispatcher<{
    edit: void;
    toggleVisibility: { currentState: boolean };
    delete: void;
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

  function handleToggleVisibility() {
    dispatch('toggleVisibility', { currentState: isVisible });
    close();
  }

  function handleDelete() {
    dispatch('delete');
    close();
  }

  function close() {
    // Dispatch a custom event that parent can listen to
    const event = new CustomEvent('close');
    menuElement?.dispatchEvent(event);
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
