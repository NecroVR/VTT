/**
 * Drag and Drop Utility for Reorderable Lists
 *
 * Provides native HTML5 drag and drop functionality for reordering items in lists.
 * Uses a simple API that integrates with Svelte components.
 */

export interface DragDropOptions {
  /**
   * Callback when an item is dropped in a new position
   * @param fromIndex - Original index of the dragged item
   * @param toIndex - New index where the item should be placed
   */
  onReorder: (fromIndex: number, toIndex: number) => void;

  /**
   * Optional class to add to the item being dragged
   * @default 'dragging'
   */
  draggingClass?: string;

  /**
   * Optional class to add to valid drop targets
   * @default 'drag-over'
   */
  dragOverClass?: string;

  /**
   * Whether to show a drop indicator line
   * @default true
   */
  showDropIndicator?: boolean;
}

interface DragState {
  draggedIndex: number | null;
  dropIndicator: HTMLElement | null;
}

/**
 * Creates drag and drop functionality for a list container
 *
 * @param container - The container element holding the list items
 * @param itemSelector - CSS selector for draggable items within the container
 * @param handleSelector - CSS selector for drag handles within each item
 * @param options - Configuration options
 * @returns Cleanup function to remove event listeners
 */
export function createDragDrop(
  container: HTMLElement,
  itemSelector: string,
  handleSelector: string,
  options: DragDropOptions
): () => void {
  const {
    onReorder,
    draggingClass = 'dragging',
    dragOverClass = 'drag-over',
    showDropIndicator = true
  } = options;

  const state: DragState = {
    draggedIndex: null,
    dropIndicator: null
  };

  // Create drop indicator element
  if (showDropIndicator) {
    state.dropIndicator = document.createElement('div');
    state.dropIndicator.className = 'drop-indicator';
    state.dropIndicator.style.position = 'absolute';
    state.dropIndicator.style.left = '0';
    state.dropIndicator.style.right = '0';
    state.dropIndicator.style.height = '2px';
    state.dropIndicator.style.background = '#007bff';
    state.dropIndicator.style.display = 'none';
    state.dropIndicator.style.pointerEvents = 'none';
    state.dropIndicator.style.zIndex = '1000';
  }

  /**
   * Get the index of an item element
   */
  function getItemIndex(item: Element): number {
    const items = Array.from(container.querySelectorAll(itemSelector));
    return items.indexOf(item);
  }

  /**
   * Find the closest draggable item from an element
   */
  function getClosestItem(element: Element): Element | null {
    return element.closest(itemSelector);
  }

  /**
   * Handle drag start
   */
  function handleDragStart(event: DragEvent): void {
    const target = event.target as Element;
    const item = getClosestItem(target);

    if (!item) return;

    state.draggedIndex = getItemIndex(item);

    // Add dragging class
    item.classList.add(draggingClass);

    // Set drag data (required for Firefox)
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', item.innerHTML);
    }

    // Add drop indicator to DOM if enabled
    if (state.dropIndicator) {
      container.appendChild(state.dropIndicator);
    }
  }

  /**
   * Handle drag over
   */
  function handleDragOver(event: DragEvent): void {
    event.preventDefault();

    if (state.draggedIndex === null) return;

    const target = event.target as Element;
    const item = getClosestItem(target);

    if (!item) return;

    const targetIndex = getItemIndex(item);

    if (targetIndex === -1 || targetIndex === state.draggedIndex) {
      // Remove drag over class from all items
      container.querySelectorAll(`.${dragOverClass}`).forEach(el => {
        el.classList.remove(dragOverClass);
      });

      if (state.dropIndicator) {
        state.dropIndicator.style.display = 'none';
      }
      return;
    }

    // Add drag over class to target
    container.querySelectorAll(`.${dragOverClass}`).forEach(el => {
      el.classList.remove(dragOverClass);
    });
    item.classList.add(dragOverClass);

    // Update drop indicator position
    if (state.dropIndicator) {
      const rect = item.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Determine if we should show indicator above or below
      const mouseY = event.clientY;
      const itemMidpoint = rect.top + rect.height / 2;

      let indicatorTop: number;
      if (mouseY < itemMidpoint) {
        // Show above
        indicatorTop = rect.top - containerRect.top;
      } else {
        // Show below
        indicatorTop = rect.bottom - containerRect.top;
      }

      state.dropIndicator.style.top = `${indicatorTop}px`;
      state.dropIndicator.style.display = 'block';
    }

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  /**
   * Handle drag enter
   */
  function handleDragEnter(event: DragEvent): void {
    event.preventDefault();
  }

  /**
   * Handle drag leave
   */
  function handleDragLeave(event: DragEvent): void {
    const target = event.target as Element;
    const item = getClosestItem(target);

    if (item && event.relatedTarget) {
      const relatedItem = getClosestItem(event.relatedTarget as Element);
      if (relatedItem !== item) {
        item.classList.remove(dragOverClass);
      }
    }
  }

  /**
   * Handle drop
   */
  function handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (state.draggedIndex === null) return;

    const target = event.target as Element;
    const item = getClosestItem(target);

    if (!item) return;

    const targetIndex = getItemIndex(item);

    if (targetIndex !== -1 && targetIndex !== state.draggedIndex) {
      // Determine final index based on drop position
      const rect = item.getBoundingClientRect();
      const mouseY = event.clientY;
      const itemMidpoint = rect.top + rect.height / 2;

      let finalIndex = targetIndex;
      if (mouseY > itemMidpoint && targetIndex < state.draggedIndex) {
        // Dropping below item, and dragging from below -> use targetIndex + 1
        // But since we remove first, this is actually targetIndex
        finalIndex = targetIndex + 1;
      } else if (mouseY < itemMidpoint && targetIndex > state.draggedIndex) {
        // Dropping above item, and dragging from above -> use targetIndex - 1
        // But since we remove first, this is actually targetIndex - 1
        finalIndex = targetIndex - 1;
      }

      onReorder(state.draggedIndex, finalIndex);
    }

    // Cleanup
    cleanup();
  }

  /**
   * Handle drag end
   */
  function handleDragEnd(): void {
    cleanup();
  }

  /**
   * Cleanup drag state
   */
  function cleanup(): void {
    // Remove dragging class
    if (state.draggedIndex !== null) {
      const items = container.querySelectorAll(itemSelector);
      items.forEach(item => {
        item.classList.remove(draggingClass);
        item.classList.remove(dragOverClass);
      });
    }

    // Hide drop indicator
    if (state.dropIndicator) {
      state.dropIndicator.style.display = 'none';
      if (state.dropIndicator.parentNode) {
        state.dropIndicator.parentNode.removeChild(state.dropIndicator);
      }
    }

    state.draggedIndex = null;
  }

  // Attach event listeners to container (event delegation)
  container.addEventListener('dragstart', handleDragStart);
  container.addEventListener('dragover', handleDragOver);
  container.addEventListener('dragenter', handleDragEnter);
  container.addEventListener('dragleave', handleDragLeave);
  container.addEventListener('drop', handleDrop);
  container.addEventListener('dragend', handleDragEnd);

  // Make drag handles initiate drag on their parent items
  const observer = new MutationObserver(() => {
    const handles = container.querySelectorAll(handleSelector);
    handles.forEach(handle => {
      const item = getClosestItem(handle);
      if (item) {
        // Set draggable on the item
        item.setAttribute('draggable', 'true');

        // Prevent text selection on handle
        (handle as HTMLElement).style.userSelect = 'none';
        (handle as HTMLElement).style.cursor = 'grab';
      }
    });
  });

  observer.observe(container, { childList: true, subtree: true });

  // Initial setup
  const handles = container.querySelectorAll(handleSelector);
  handles.forEach(handle => {
    const item = getClosestItem(handle);
    if (item) {
      item.setAttribute('draggable', 'true');
      (handle as HTMLElement).style.userSelect = 'none';
      (handle as HTMLElement).style.cursor = 'grab';
    }
  });

  // Return cleanup function
  return () => {
    container.removeEventListener('dragstart', handleDragStart);
    container.removeEventListener('dragover', handleDragOver);
    container.removeEventListener('dragenter', handleDragEnter);
    container.removeEventListener('dragleave', handleDragLeave);
    container.removeEventListener('drop', handleDrop);
    container.removeEventListener('dragend', handleDragEnd);
    observer.disconnect();
    cleanup();
  };
}
