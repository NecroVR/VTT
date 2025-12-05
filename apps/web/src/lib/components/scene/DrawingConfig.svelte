<script lang="ts">
  import { drawingsStore } from '$lib/stores/drawings';
  import type { Drawing } from '@vtt/shared';
  import { API_BASE_URL } from '$lib/config/api';

  // Props
  export let isOpen: boolean = false;
  export let drawingId: string = '';
  export let sceneId: string = '';
  export let onClose: () => void = () => {};

  // Local state
  let drawing: Drawing | null = null;
  let strokeColor: string = '#000000';
  let strokeWidth: number = 2;
  let strokeAlpha: number = 1;
  let fillColor: string = '#000000';
  let fillAlpha: number = 0.5;
  let hasFill: boolean = false;
  let text: string = '';
  let fontSize: number = 16;
  let fontFamily: string = 'Arial';
  let locked: boolean = false;

  // Subscribe to store and load drawing when drawingId changes
  $: if (isOpen && drawingId) {
    loadDrawing();
  }

  function loadDrawing() {
    drawingsStore.subscribe(state => {
      const d = state.drawings.get(drawingId);
      if (d) {
        drawing = d;
        strokeColor = d.strokeColor;
        strokeWidth = d.strokeWidth;
        strokeAlpha = d.strokeAlpha;
        fillColor = d.fillColor || '#000000';
        fillAlpha = d.fillAlpha;
        hasFill = !!d.fillColor;
        text = d.text || '';
        fontSize = d.fontSize || 16;
        fontFamily = d.fontFamily || 'Arial';
        locked = d.locked;
      }
    })();
  }

  async function handleSave() {
    if (!drawing) return;

    const updates: any = {
      strokeColor,
      strokeWidth,
      strokeAlpha,
      fillColor: hasFill ? fillColor : null,
      fillAlpha,
      locked,
    };

    if (drawing.drawingType === 'text') {
      updates.text = text;
      updates.fontSize = fontSize;
      updates.fontFamily = fontFamily;
      updates.textColor = strokeColor;
    }

    // Update local store
    drawingsStore.updateDrawing(drawingId, updates);

    // TODO: Send update to backend via WebSocket or API
    try {
      const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/drawings/${drawingId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update drawing: ${response.statusText}`);
      }

      // TODO: Emit WebSocket event for real-time sync
      // websocketService.emit('drawing:update', { drawingId, sceneId, updates });
    } catch (error) {
      console.error('Error updating drawing:', error);
    }

    onClose();
  }

  async function handleDelete() {
    if (!drawing) return;

    if (!confirm('Are you sure you want to delete this drawing?')) {
      return;
    }

    // Remove from local store
    drawingsStore.removeDrawing(drawingId);

    // TODO: Send delete to backend via WebSocket or API
    try {
      const token = localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');

      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/scenes/${sceneId}/drawings/${drawingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete drawing: ${response.statusText}`);
      }

      // TODO: Emit WebSocket event for real-time sync
      // websocketService.emit('drawing:delete', { drawingId, sceneId });
    } catch (error) {
      console.error('Error deleting drawing:', error);
    }

    onClose();
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }
</script>

{#if isOpen && drawing}
  <div class="modal-overlay" on:click={handleOverlayClick} role="presentation">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Edit Drawing</h2>
        <button class="close-button" on:click={onClose} aria-label="Close">×</button>
      </div>

      <div class="modal-body">
        <!-- Stroke Settings -->
        <div class="form-section">
          <h3 class="section-title">Stroke</h3>

          <div class="form-group">
            <label for="stroke-color">Color</label>
            <input
              id="stroke-color"
              type="color"
              bind:value={strokeColor}
              class="color-input"
            />
          </div>

          <div class="form-group">
            <label for="stroke-width">Width: {strokeWidth}px</label>
            <input
              id="stroke-width"
              type="range"
              min="1"
              max="20"
              step="1"
              bind:value={strokeWidth}
              class="slider"
            />
          </div>

          <div class="form-group">
            <label for="stroke-alpha">Opacity: {Math.round(strokeAlpha * 100)}%</label>
            <input
              id="stroke-alpha"
              type="range"
              min="0"
              max="1"
              step="0.05"
              bind:value={strokeAlpha}
              class="slider"
            />
          </div>
        </div>

        <!-- Fill Settings (if applicable) -->
        {#if drawing.drawingType !== 'freehand' && drawing.drawingType !== 'text'}
          <div class="form-section">
            <h3 class="section-title">Fill</h3>

            <div class="form-group">
              <label>
                <input type="checkbox" bind:checked={hasFill} />
                Enable Fill
              </label>
            </div>

            {#if hasFill}
              <div class="form-group">
                <label for="fill-color">Color</label>
                <input
                  id="fill-color"
                  type="color"
                  bind:value={fillColor}
                  class="color-input"
                />
              </div>

              <div class="form-group">
                <label for="fill-alpha">Opacity: {Math.round(fillAlpha * 100)}%</label>
                <input
                  id="fill-alpha"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  bind:value={fillAlpha}
                  class="slider"
                />
              </div>
            {/if}
          </div>
        {/if}

        <!-- Text Settings (if text drawing) -->
        {#if drawing.drawingType === 'text'}
          <div class="form-section">
            <h3 class="section-title">Text</h3>

            <div class="form-group">
              <label for="text-content">Content</label>
              <textarea
                id="text-content"
                bind:value={text}
                class="text-input"
                rows="3"
              />
            </div>

            <div class="form-group">
              <label for="font-size">Font Size: {fontSize}px</label>
              <input
                id="font-size"
                type="range"
                min="8"
                max="72"
                step="1"
                bind:value={fontSize}
                class="slider"
              />
            </div>

            <div class="form-group">
              <label for="font-family">Font Family</label>
              <select id="font-family" bind:value={fontFamily} class="select">
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
              </select>
            </div>
          </div>
        {/if}

        <!-- Other Settings -->
        <div class="form-section">
          <h3 class="section-title">Options</h3>

          <div class="form-group">
            <label>
              <input type="checkbox" bind:checked={locked} />
              Lock Drawing
            </label>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="button button-danger" on:click={handleDelete}>
          Delete
        </button>
        <div class="button-group">
          <button class="button button-secondary" on:click={onClose}>
            Cancel
          </button>
          <button class="button button-primary" on:click={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .modal-content {
    background-color: #1f2937;
    border: 1px solid #374151;
    border-radius: 0.5rem;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #374151;
  }

  .modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #f9fafb;
    margin: 0;
  }

  .close-button {
    background: none;
    border: none;
    color: #9ca3af;
    font-size: 2rem;
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
    transition: all 0.2s;
  }

  .close-button:hover {
    color: #f9fafb;
    background-color: #374151;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .form-section {
    margin-bottom: 1.5rem;
  }

  .form-section:last-child {
    margin-bottom: 0;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #f9fafb;
    margin: 0 0 1rem 0;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group:last-child {
    margin-bottom: 0;
  }

  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #d1d5db;
    margin-bottom: 0.5rem;
  }

  .color-input {
    width: 100%;
    height: 3rem;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    cursor: pointer;
    background-color: #111827;
  }

  .slider {
    width: 100%;
    height: 0.5rem;
    border-radius: 0.25rem;
    background: #374151;
    outline: none;
    cursor: pointer;
  }

  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
  }

  .slider::-moz-range-thumb {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: none;
  }

  .text-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    background-color: #111827;
    color: #f9fafb;
    font-size: 0.875rem;
    font-family: inherit;
    resize: vertical;
  }

  .select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    background-color: #111827;
    color: #f9fafb;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-top: 1px solid #374151;
  }

  .button-group {
    display: flex;
    gap: 0.5rem;
  }

  .button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .button-primary {
    background-color: #3b82f6;
    color: #ffffff;
  }

  .button-primary:hover {
    background-color: #2563eb;
  }

  .button-secondary {
    background-color: #374151;
    color: #d1d5db;
  }

  .button-secondary:hover {
    background-color: #4b5563;
  }

  .button-danger {
    background-color: #dc2626;
    color: #ffffff;
  }

  .button-danger:hover {
    background-color: #b91c1c;
  }

  input[type="checkbox"] {
    margin-right: 0.5rem;
    cursor: pointer;
  }
</style>
