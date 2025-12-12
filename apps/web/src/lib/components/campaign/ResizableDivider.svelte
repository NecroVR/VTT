<script lang="ts">
  import { onMount } from 'svelte';

  // Props
  export let initialWidth = 350;
  export let minWidth = 250;
  export let maxWidth = Infinity; // Allow unlimited width - user can drag as wide as they want
  export let storageKey = 'vtt-sidebar-width';

  // Dispatch width change event
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher<{ widthChange: number }>();

  let isDragging = false;
  let currentWidth = initialWidth;

  onMount(() => {
    // Load saved width from localStorage
    const savedWidth = localStorage.getItem(storageKey);
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10);
      if (!isNaN(parsedWidth) && parsedWidth >= minWidth && parsedWidth <= maxWidth) {
        currentWidth = parsedWidth;
        dispatch('widthChange', currentWidth);
      }
    }

    // Add global mouse event listeners
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      // Calculate new width based on distance from right edge of viewport
      const newWidth = window.innerWidth - e.clientX;

      // Clamp width between min and max
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

      currentWidth = clampedWidth;
      dispatch('widthChange', currentWidth);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        // Save width to localStorage
        localStorage.setItem(storageKey, currentWidth.toString());
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  });

  function handleMouseDown() {
    isDragging = true;
  }
</script>

<div
  class="resizable-divider"
  class:dragging={isDragging}
  on:mousedown={handleMouseDown}
  role="separator"
  aria-orientation="vertical"
  aria-label="Resize sidebar"
  tabindex="0"
  on:keydown={(e) => {
    if (e.key === 'ArrowLeft') {
      const newWidth = Math.min(maxWidth, currentWidth + 20);
      currentWidth = newWidth;
      dispatch('widthChange', currentWidth);
      localStorage.setItem(storageKey, currentWidth.toString());
    } else if (e.key === 'ArrowRight') {
      const newWidth = Math.max(minWidth, currentWidth - 20);
      currentWidth = newWidth;
      dispatch('widthChange', currentWidth);
      localStorage.setItem(storageKey, currentWidth.toString());
    }
  }}
>
  <div class="divider-handle"></div>
</div>

<style>
  .resizable-divider {
    width: 4px;
    background-color: #374151;
    cursor: col-resize;
    position: relative;
    flex-shrink: 0;
    transition: background-color 0.2s ease;
    user-select: none;
  }

  .resizable-divider:hover,
  .resizable-divider:focus {
    background-color: #4b5563;
    outline: none;
  }

  .resizable-divider.dragging {
    background-color: #3b82f6;
  }

  .divider-handle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 3px;
    height: 40px;
    background-color: #6b7280;
    border-radius: 2px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .resizable-divider:hover .divider-handle,
  .resizable-divider:focus .divider-handle,
  .resizable-divider.dragging .divider-handle {
    opacity: 1;
  }

  .resizable-divider.dragging .divider-handle {
    background-color: #60a5fa;
  }
</style>
