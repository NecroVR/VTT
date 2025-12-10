<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  // Props
  export let id: string;
  export let title: string;
  export let initialPosition: { x: number; y: number } = { x: 100, y: 100 };
  export let initialSize: { width: number; height: number } = { width: 350, height: 400 };
  export let minWidth: number = 250;
  export let minHeight: number = 200;
  export let zIndex: number = 500;
  export let closeable: boolean = true;
  export let minimizable: boolean = true;

  const dispatch = createEventDispatcher<{
    close: void;
    focus: void;
    move: { x: number; y: number };
    resize: { width: number; height: number };
  }>();

  // Boundary constraint constants
  const TITLEBAR_HEIGHT = 40;  // Keep titlebar visible
  const MIN_VISIBLE_WIDTH = 100;  // Minimum horizontal visibility

  // State
  let position = { ...initialPosition };
  let size = { ...initialSize };
  let isMinimized = false;
  let isDragging = false;
  let isResizing = false;
  let resizeDirection = '';

  // Drag state
  let dragOffset = { x: 0, y: 0 };

  // Resize state
  let resizeStartPos = { x: 0, y: 0 };
  let resizeStartSize = { width: 0, height: 0 };

  // Window element
  let windowElement: HTMLDivElement;

  // Constrain position to keep window within viewport bounds
  function constrainPosition(x: number, y: number, width: number, height: number): { x: number; y: number } {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Horizontal: Ensure at least MIN_VISIBLE_WIDTH pixels are on-screen
    const constrainedX = Math.max(
      -width + MIN_VISIBLE_WIDTH,  // Allow most of window off left edge
      Math.min(x, viewportWidth - MIN_VISIBLE_WIDTH)  // Allow most of window off right edge
    );

    // Vertical: Keep titlebar within viewport (cannot go above top or below bottom)
    const constrainedY = Math.max(
      0,  // Cannot go above viewport top
      Math.min(y, viewportHeight - TITLEBAR_HEIGHT)  // Titlebar must stay above viewport bottom
    );

    return { x: constrainedX, y: constrainedY };
  }

  // Handle window focus
  function handleFocus() {
    dispatch('focus');
  }

  // Handle close
  function handleClose() {
    if (closeable) {
      dispatch('close');
    }
  }

  // Handle minimize
  function handleMinimize() {
    if (minimizable) {
      isMinimized = !isMinimized;
    }
  }

  // Start dragging
  function startDrag(event: MouseEvent) {
    if (isMinimized) return;

    isDragging = true;
    dragOffset.x = event.clientX - position.x;
    dragOffset.y = event.clientY - position.y;

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);

    handleFocus();
    event.preventDefault();
  }

  // During drag
  function onDrag(event: MouseEvent) {
    if (!isDragging) return;

    let newX = event.clientX - dragOffset.x;
    let newY = event.clientY - dragOffset.y;

    const windowWidth = windowElement?.offsetWidth || size.width;
    const windowHeight = windowElement?.offsetHeight || size.height;

    const constrained = constrainPosition(newX, newY, windowWidth, windowHeight);
    position.x = constrained.x;
    position.y = constrained.y;
  }

  // Stop dragging
  function stopDrag() {
    if (isDragging) {
      isDragging = false;
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', stopDrag);
      dispatch('move', { x: position.x, y: position.y });
    }
  }

  // Start resizing
  function startResize(event: MouseEvent, direction: string) {
    if (isMinimized) return;

    isResizing = true;
    resizeDirection = direction;
    resizeStartPos.x = event.clientX;
    resizeStartPos.y = event.clientY;
    resizeStartSize.width = size.width;
    resizeStartSize.height = size.height;

    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', stopResize);

    handleFocus();
    event.preventDefault();
    event.stopPropagation();
  }

  // During resize
  function onResize(event: MouseEvent) {
    if (!isResizing) return;

    const deltaX = event.clientX - resizeStartPos.x;
    const deltaY = event.clientY - resizeStartPos.y;

    let newWidth = resizeStartSize.width;
    let newHeight = resizeStartSize.height;
    let newX = position.x;
    let newY = position.y;

    // Apply deltas based on resize direction
    if (resizeDirection.includes('e')) {
      newWidth = Math.max(minWidth, resizeStartSize.width + deltaX);
    }
    if (resizeDirection.includes('w')) {
      const potentialWidth = Math.max(minWidth, resizeStartSize.width - deltaX);
      if (potentialWidth > minWidth) {
        newWidth = potentialWidth;
        newX = position.x + (resizeStartSize.width - potentialWidth);
      }
    }
    if (resizeDirection.includes('s')) {
      newHeight = Math.max(minHeight, resizeStartSize.height + deltaY);
    }
    if (resizeDirection.includes('n')) {
      const potentialHeight = Math.max(minHeight, resizeStartSize.height - deltaY);
      if (potentialHeight > minHeight) {
        newHeight = potentialHeight;
        newY = position.y + (resizeStartSize.height - potentialHeight);
      }
    }

    // Apply boundary constraints to position
    const constrained = constrainPosition(newX, newY, newWidth, newHeight);

    // If position was constrained, also constrain the size appropriately
    // This prevents the window from growing past the screen edge
    if (resizeDirection.includes('w') && constrained.x !== newX) {
      // Window hit left boundary, adjust width
      newWidth = Math.max(minWidth, size.width + (position.x - constrained.x));
    }
    if (resizeDirection.includes('n') && constrained.y !== newY) {
      // Window hit top boundary, adjust height
      newHeight = Math.max(minHeight, size.height + (position.y - constrained.y));
    }
    if (resizeDirection.includes('e')) {
      // Limit right edge to keep MIN_VISIBLE_WIDTH on screen
      const maxWidth = window.innerWidth - constrained.x - MIN_VISIBLE_WIDTH + size.width;
      newWidth = Math.min(newWidth, maxWidth);
    }
    if (resizeDirection.includes('s')) {
      // Limit bottom edge to viewport
      const maxHeight = window.innerHeight - constrained.y;
      newHeight = Math.min(newHeight, maxHeight);
    }

    size.width = newWidth;
    size.height = newHeight;
    position.x = constrained.x;
    position.y = constrained.y;
  }

  // Stop resizing
  function stopResize() {
    if (isResizing) {
      isResizing = false;
      resizeDirection = '';
      document.removeEventListener('mousemove', onResize);
      document.removeEventListener('mouseup', stopResize);
      dispatch('resize', { width: size.width, height: size.height });
    }
  }

  // Handle browser window resize
  function handleWindowResize() {
    const windowWidth = windowElement?.offsetWidth || size.width;
    const windowHeight = windowElement?.offsetHeight || size.height;
    const constrained = constrainPosition(position.x, position.y, windowWidth, windowHeight);

    if (constrained.x !== position.x || constrained.y !== position.y) {
      position.x = constrained.x;
      position.y = constrained.y;
      dispatch('move', { x: position.x, y: position.y });
    }
  }

  // Initialize and validate position on mount
  onMount(() => {
    // Validate initial position is within bounds
    const windowWidth = size.width;
    const windowHeight = size.height;
    const constrained = constrainPosition(position.x, position.y, windowWidth, windowHeight);

    if (constrained.x !== position.x || constrained.y !== position.y) {
      position.x = constrained.x;
      position.y = constrained.y;
      dispatch('move', { x: position.x, y: position.y });
    }

    // Listen for browser window resize
    window.addEventListener('resize', handleWindowResize);
  });

  // Cleanup on destroy
  onDestroy(() => {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', stopResize);
    window.removeEventListener('resize', handleWindowResize);
  });

  // Get cursor style for resize direction
  function getResizeCursor(direction: string): string {
    const cursors: Record<string, string> = {
      'n': 'ns-resize',
      's': 'ns-resize',
      'e': 'ew-resize',
      'w': 'ew-resize',
      'ne': 'nesw-resize',
      'nw': 'nwse-resize',
      'se': 'nwse-resize',
      'sw': 'nesw-resize'
    };
    return cursors[direction] || 'default';
  }
</script>

<div
  bind:this={windowElement}
  class="floating-window"
  class:minimized={isMinimized}
  style:left="{position.x}px"
  style:top="{position.y}px"
  style:width="{size.width}px"
  style:height={isMinimized ? 'auto' : `${size.height}px`}
  style:z-index={zIndex}
  on:mousedown={handleFocus}
  data-window-id={id}
>
  <!-- Titlebar -->
  <div
    class="floating-window-titlebar"
    on:mousedown={startDrag}
  >
    <div class="title-text">{title}</div>
    <div class="title-buttons">
      {#if minimizable}
        <button
          class="title-button"
          on:click|stopPropagation={handleMinimize}
          aria-label={isMinimized ? 'Maximize' : 'Minimize'}
        >
          {isMinimized ? '□' : '−'}
        </button>
      {/if}
      {#if closeable}
        <button
          class="title-button"
          on:click|stopPropagation={handleClose}
          aria-label="Close"
        >
          ×
        </button>
      {/if}
    </div>
  </div>

  <!-- Content -->
  {#if !isMinimized}
    <div class="floating-window-content">
      <slot />
    </div>

    <!-- Resize handles -->
    <div class="resize-handles">
      <!-- Edge handles -->
      <div
        class="resize-handle resize-n"
        style:cursor={getResizeCursor('n')}
        on:mousedown={(e) => startResize(e, 'n')}
      ></div>
      <div
        class="resize-handle resize-s"
        style:cursor={getResizeCursor('s')}
        on:mousedown={(e) => startResize(e, 's')}
      ></div>
      <div
        class="resize-handle resize-e"
        style:cursor={getResizeCursor('e')}
        on:mousedown={(e) => startResize(e, 'e')}
      ></div>
      <div
        class="resize-handle resize-w"
        style:cursor={getResizeCursor('w')}
        on:mousedown={(e) => startResize(e, 'w')}
      ></div>

      <!-- Corner handles -->
      <div
        class="resize-handle resize-ne"
        style:cursor={getResizeCursor('ne')}
        on:mousedown={(e) => startResize(e, 'ne')}
      ></div>
      <div
        class="resize-handle resize-nw"
        style:cursor={getResizeCursor('nw')}
        on:mousedown={(e) => startResize(e, 'nw')}
      ></div>
      <div
        class="resize-handle resize-se"
        style:cursor={getResizeCursor('se')}
        on:mousedown={(e) => startResize(e, 'se')}
      ></div>
      <div
        class="resize-handle resize-sw"
        style:cursor={getResizeCursor('sw')}
        on:mousedown={(e) => startResize(e, 'sw')}
      ></div>
    </div>
  {/if}
</div>

<style>
  .floating-window {
    position: fixed;
    pointer-events: auto;
    background-color: #1f2937;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #374151;
  }

  .floating-window.minimized {
    height: auto !important;
  }

  .floating-window-titlebar {
    padding: 8px 12px;
    background-color: #111827;
    cursor: grab;
    display: flex;
    justify-content: space-between;
    align-items: center;
    user-select: none;
    border-bottom: 1px solid #374151;
    min-height: 40px;
  }

  .floating-window-titlebar:active {
    cursor: grabbing;
  }

  .title-text {
    font-size: 0.875rem;
    font-weight: 600;
    color: #f9fafb;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .title-buttons {
    display: flex;
    gap: 4px;
    margin-left: 8px;
  }

  .title-button {
    background: none;
    border: none;
    color: #9ca3af;
    font-size: 1.25rem;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s, color 0.2s;
  }

  .title-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #f9fafb;
  }

  .floating-window-content {
    flex: 1;
    overflow: auto;
    min-height: 0;
    padding: 12px;
    background-color: #1f2937;
  }

  /* Resize handles */
  .resize-handles {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .resize-handle {
    position: absolute;
    pointer-events: auto;
  }

  /* Edge handles */
  .resize-n {
    top: 0;
    left: 8px;
    right: 8px;
    height: 4px;
  }

  .resize-s {
    bottom: 0;
    left: 8px;
    right: 8px;
    height: 4px;
  }

  .resize-e {
    right: 0;
    top: 8px;
    bottom: 8px;
    width: 4px;
  }

  .resize-w {
    left: 0;
    top: 8px;
    bottom: 8px;
    width: 4px;
  }

  /* Corner handles */
  .resize-ne {
    top: 0;
    right: 0;
    width: 12px;
    height: 12px;
  }

  .resize-nw {
    top: 0;
    left: 0;
    width: 12px;
    height: 12px;
  }

  .resize-se {
    bottom: 0;
    right: 0;
    width: 12px;
    height: 12px;
  }

  .resize-sw {
    bottom: 0;
    left: 0;
    width: 12px;
    height: 12px;
  }

  /* Scrollbar styling */
  .floating-window-content::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .floating-window-content::-webkit-scrollbar-track {
    background: #111827;
  }

  .floating-window-content::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 4px;
  }

  .floating-window-content::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
</style>
