<script lang="ts">
  import { onMount } from 'svelte';
  import type { ContextMenuEntry, ContextMenuItem } from '$lib/types/contextMenu';

  interface Props {
    items: ContextMenuEntry[];
    x: number;
    y: number;
    onClose: () => void;
  }

  let { items, x, y, onClose }: Props = $props();

  let menuElement: HTMLDivElement | undefined = $state();
  let focusedIndex = $state(0);

  // Calculate viewport-aware position
  let position = $derived.by(() => {
    if (!menuElement) return { x, y };

    const rect = menuElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    // Adjust horizontal position if menu would overflow
    if (x + rect.width > viewportWidth) {
      adjustedX = Math.max(0, viewportWidth - rect.width - 8);
    }

    // Adjust vertical position if menu would overflow
    if (y + rect.height > viewportHeight) {
      adjustedY = Math.max(0, viewportHeight - rect.height - 8);
    }

    return { x: adjustedX, y: adjustedY };
  });

  // Get only actionable items (not dividers)
  let actionableItems = $derived(
    items.filter((item): item is ContextMenuItem =>
      'id' in item && !item.disabled
    )
  );

  // Handle click outside to close
  function handleClickOutside(event: MouseEvent) {
    if (menuElement && !menuElement.contains(event.target as Node)) {
      onClose();
    }
  }

  // Handle escape key to close
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusedIndex = Math.min(focusedIndex + 1, actionableItems.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusedIndex = Math.max(focusedIndex - 1, 0);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = actionableItems[focusedIndex];
      if (item) {
        item.action();
        onClose();
      }
    }
  }

  // Handle item click
  function handleItemClick(item: ContextMenuItem) {
    if (item.disabled) return;
    item.action();
    onClose();
  }

  onMount(() => {
    // Add event listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeydown);

    // Focus the menu
    menuElement?.focus();

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<div
  bind:this={menuElement}
  class="context-menu"
  style="left: {position.x}px; top: {position.y}px;"
  role="menu"
  tabindex="-1"
  aria-label="Context menu"
>
  {#each items as item, index}
    {#if 'type' in item && item.type === 'divider'}
      <div class="context-menu-divider" role="separator"></div>
    {:else if 'id' in item}
      {@const actionableIndex = actionableItems.indexOf(item)}
      <button
        class="context-menu-item"
        class:disabled={item.disabled}
        class:danger={item.danger}
        class:focused={actionableIndex === focusedIndex}
        role="menuitem"
        tabindex={item.disabled ? -1 : 0}
        aria-disabled={item.disabled}
        onclick={() => handleItemClick(item)}
        onmouseenter={() => { if (!item.disabled) focusedIndex = actionableIndex; }}
      >
        {#if item.icon}
          <span class="context-menu-item-icon">{item.icon}</span>
        {/if}
        <span class="context-menu-item-label">{item.label}</span>
      </button>
    {/if}
  {/each}
</div>

<style>
  .context-menu {
    position: fixed;
    z-index: 10000;
    background: var(--bg-primary, #ffffff);
    border: 1px solid var(--border-color, #ccc);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 4px;
    min-width: 180px;
    max-width: 300px;
    outline: none;
  }

  .context-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    background: none;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    text-align: left;
    color: var(--text-color, #333);
    transition: background-color 0.15s ease;
  }

  .context-menu-item:hover:not(.disabled),
  .context-menu-item.focused:not(.disabled) {
    background: var(--hover-bg, #f0f0f0);
  }

  .context-menu-item.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .context-menu-item.danger {
    color: var(--danger-color, #d00);
  }

  .context-menu-item.danger:hover:not(.disabled),
  .context-menu-item.danger.focused:not(.disabled) {
    background: var(--danger-bg-light, #fee);
  }

  .context-menu-item-icon {
    flex-shrink: 0;
    font-size: 1rem;
    line-height: 1;
  }

  .context-menu-item-label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .context-menu-divider {
    height: 1px;
    background: var(--border-color, #e0e0e0);
    margin: 4px 0;
  }
</style>
