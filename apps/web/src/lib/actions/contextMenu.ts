/**
 * Context Menu Action
 *
 * Svelte action for attaching context menus to elements.
 * Handles right-click and keyboard triggers (Shift+F10, Context Menu key).
 *
 * Usage:
 * ```svelte
 * <div use:contextMenu={menuItems}>...</div>
 * ```
 */

import type { ContextMenuEntry } from '$lib/types/contextMenu';

export interface ContextMenuConfig {
  items: ContextMenuEntry[] | (() => ContextMenuEntry[]);
  disabled?: boolean;
}

export interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuEntry[];
}

// Global state for context menu
let activeContextMenu: ContextMenuState | null = null;
let contextMenuListeners: Set<(state: ContextMenuState | null) => void> = new Set();

/**
 * Subscribe to context menu state changes
 */
export function subscribeToContextMenu(
  callback: (state: ContextMenuState | null) => void
): () => void {
  contextMenuListeners.add(callback);
  // Immediately call with current state
  callback(activeContextMenu);

  return () => {
    contextMenuListeners.delete(callback);
  };
}

/**
 * Get the current context menu state
 */
export function getContextMenuState(): ContextMenuState | null {
  return activeContextMenu;
}

/**
 * Show a context menu at the specified position
 */
export function showContextMenu(x: number, y: number, items: ContextMenuEntry[]): void {
  activeContextMenu = { x, y, items };
  contextMenuListeners.forEach(listener => listener(activeContextMenu));
}

/**
 * Close the active context menu
 */
export function closeContextMenu(): void {
  activeContextMenu = null;
  contextMenuListeners.forEach(listener => listener(null));
}

/**
 * Svelte action for context menu
 */
export function contextMenu(
  node: HTMLElement,
  config: ContextMenuConfig | ContextMenuEntry[]
): { destroy: () => void } {
  let normalizedConfig: ContextMenuConfig;

  // Normalize config
  if (Array.isArray(config)) {
    normalizedConfig = { items: config };
  } else {
    normalizedConfig = config;
  }

  function handleContextMenu(event: MouseEvent) {
    // Check if disabled
    if (normalizedConfig.disabled) return;

    event.preventDefault();
    event.stopPropagation();

    // Get items (call function if provided)
    const items = typeof normalizedConfig.items === 'function'
      ? normalizedConfig.items()
      : normalizedConfig.items;

    // Show context menu at click position
    showContextMenu(event.clientX, event.clientY, items);
  }

  function handleKeydown(event: KeyboardEvent) {
    // Check if disabled
    if (normalizedConfig.disabled) return;

    // Shift+F10 or Context Menu key
    if ((event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu') {
      event.preventDefault();
      event.stopPropagation();

      // Get items (call function if provided)
      const items = typeof normalizedConfig.items === 'function'
        ? normalizedConfig.items()
        : normalizedConfig.items;

      // Show context menu at element position
      const rect = node.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      showContextMenu(x, y, items);
    }
  }

  // Add event listeners
  node.addEventListener('contextmenu', handleContextMenu);
  node.addEventListener('keydown', handleKeydown);

  return {
    destroy() {
      node.removeEventListener('contextmenu', handleContextMenu);
      node.removeEventListener('keydown', handleKeydown);
    }
  };
}
