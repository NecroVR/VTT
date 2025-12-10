<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy, type ComponentType, type SvelteComponent } from 'svelte';

  // Props
  export let tabId: string;
  export let tabLabel: string;
  export let tabComponent: ComponentType<SvelteComponent>;
  export let tabProps: Record<string, any> = {};
  export let iconStripWidth: number = 45;

  const dispatch = createEventDispatcher<{
    close: void;
    'pop-out': string;
    'create-actor': any;
    'edit-actor': any;
    'select-token': any;
  }>();

  let panelElement: HTMLDivElement;
  let isReady = false;

  onMount(() => {
    // Use setTimeout to avoid closing from the opening click
    setTimeout(() => {
      isReady = true;
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);
  });

  onDestroy(() => {
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('keydown', handleKeyDown);
  });

  function handleClickOutside(event: MouseEvent) {
    if (!isReady) return;

    const target = event.target as Node;

    // Check if click is outside the panel
    if (panelElement && !panelElement.contains(target)) {
      // Exclude clicks on the icon strip (parent handles those)
      const isIconStripClick = (event.target as Element)?.closest?.('.collapsed-strip');
      if (!isIconStripClick) {
        close();
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      close();
    }
  }

  function handleCloseClick() {
    close();
  }

  function handlePopOutClick() {
    dispatch('pop-out', tabId);
  }

  function close() {
    dispatch('close');
  }

  // Forward events from child components
  function handleComponentEvent(event: CustomEvent) {
    // Forward the event to parent
    dispatch(event.type as any, event.detail);
  }
</script>

<div
  bind:this={panelElement}
  class="overlay-panel"
  style:right="{iconStripWidth}px"
  on:click|stopPropagation
>
  <!-- Header -->
  <div class="overlay-panel-header">
    <span class="overlay-panel-title">{tabLabel}</span>
    <div class="overlay-panel-actions">
      <button
        class="overlay-panel-action"
        on:click={handlePopOutClick}
        aria-label="Pop out to floating window"
        title="Pop out to floating window"
      >
        ⤴
      </button>
      <button
        class="overlay-panel-action overlay-panel-close"
        on:click={handleCloseClick}
        aria-label="Close panel"
      >
        ×
      </button>
    </div>
  </div>

  <!-- Content -->
  <div class="overlay-panel-content">
    <svelte:component
      this={tabComponent}
      {...tabProps}
      on:create-actor={handleComponentEvent}
      on:edit-actor={handleComponentEvent}
      on:select-token={handleComponentEvent}
    />
  </div>
</div>

<style>
  .overlay-panel {
    position: fixed;
    top: 0;
    bottom: 0;
    width: 350px;
    background-color: #1f2937;
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    z-index: 500; /* Below modals (1000), above canvas controls (10-100) */
    border-left: 1px solid #374151;
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .overlay-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background-color: #111827;
    border-bottom: 1px solid #374151;
    flex-shrink: 0;
  }

  .overlay-panel-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #f9fafb;
  }

  .overlay-panel-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .overlay-panel-action {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    line-height: 1;
    width: 28px;
    height: 28px;
    transition: background-color 0.2s, color 0.2s;
  }

  .overlay-panel-action:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #f9fafb;
  }

  .overlay-panel-close {
    font-size: 1.5rem;
  }

  .overlay-panel-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  /* Scrollbar styling for child content */
  .overlay-panel-content :global(*::-webkit-scrollbar) {
    width: 8px;
    height: 8px;
  }

  .overlay-panel-content :global(*::-webkit-scrollbar-track) {
    background: #111827;
  }

  .overlay-panel-content :global(*::-webkit-scrollbar-thumb) {
    background: #4b5563;
    border-radius: 4px;
  }

  .overlay-panel-content :global(*::-webkit-scrollbar-thumb:hover) {
    background: #6b7280;
  }
</style>
