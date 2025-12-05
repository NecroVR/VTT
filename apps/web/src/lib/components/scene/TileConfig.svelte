<script lang="ts">
  import { tilesStore } from '$lib/stores/tiles';
  import type { Tile } from '@vtt/shared';

  // Props
  export let isOpen: boolean = false;
  export let tileId: string = '';
  export let sceneId: string = '';
  export let onClose: () => void = () => {};

  // Local state
  let tile: Tile | null = null;
  let img: string = '';
  let x: number = 0;
  let y: number = 0;
  let width: number = 1;
  let height: number = 1;
  let rotation: number = 0;
  let alpha: number = 1;
  let tint: string = '';
  let hasTint: boolean = false;
  let z: number = 0;
  let overhead: boolean = false;
  let roof: boolean = false;
  let hidden: boolean = false;
  let locked: boolean = false;

  // Subscribe to store and load tile when tileId changes
  $: if (isOpen && tileId) {
    loadTile();
  }

  function loadTile() {
    tilesStore.subscribe(state => {
      const t = state.tiles.get(tileId);
      if (t) {
        tile = t;
        img = t.img;
        x = t.x;
        y = t.y;
        width = t.width;
        height = t.height;
        rotation = t.rotation;
        alpha = t.alpha;
        tint = t.tint || '';
        hasTint = !!t.tint;
        z = t.z;
        overhead = t.overhead;
        roof = t.roof;
        hidden = t.hidden;
        locked = t.locked;
      }
    })();
  }

  async function handleSave() {
    if (!tile) return;

    const updates: Partial<Tile> = {
      img,
      x,
      y,
      width,
      height,
      rotation,
      alpha,
      tint: hasTint ? tint : null,
      z,
      overhead,
      roof,
      hidden,
      locked,
    };

    // Update via store (which calls API)
    await tilesStore.updateTile(tileId, updates);
    onClose();
  }

  async function handleDelete() {
    if (!tile) return;

    if (!confirm('Are you sure you want to delete this tile?')) {
      return;
    }

    // Delete via store (which calls API)
    await tilesStore.deleteTile(tileId);
    onClose();
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }
</script>

{#if isOpen && tile}
  <div class="modal-overlay" on:click={handleOverlayClick} role="presentation">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Edit Tile</h2>
        <button class="close-button" on:click={onClose} aria-label="Close">×</button>
      </div>

      <div class="modal-body">
        <!-- Image Settings -->
        <div class="form-section">
          <h3 class="section-title">Image</h3>

          <div class="form-group">
            <label for="tile-img">Image URL</label>
            <input
              id="tile-img"
              type="text"
              bind:value={img}
              class="text-input"
              placeholder="https://example.com/image.png"
            />
          </div>
        </div>

        <!-- Position & Size -->
        <div class="form-section">
          <h3 class="section-title">Position & Size</h3>

          <div class="form-row">
            <div class="form-group">
              <label for="tile-x">X Position</label>
              <input
                id="tile-x"
                type="number"
                bind:value={x}
                step="0.1"
                class="number-input"
              />
            </div>

            <div class="form-group">
              <label for="tile-y">Y Position</label>
              <input
                id="tile-y"
                type="number"
                bind:value={y}
                step="0.1"
                class="number-input"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="tile-width">Width (grid units)</label>
              <input
                id="tile-width"
                type="number"
                bind:value={width}
                min="0.1"
                step="0.1"
                class="number-input"
              />
            </div>

            <div class="form-group">
              <label for="tile-height">Height (grid units)</label>
              <input
                id="tile-height"
                type="number"
                bind:value={height}
                min="0.1"
                step="0.1"
                class="number-input"
              />
            </div>
          </div>
        </div>

        <!-- Visual Properties -->
        <div class="form-section">
          <h3 class="section-title">Visual Properties</h3>

          <div class="form-group">
            <label for="tile-rotation">Rotation: {rotation}°</label>
            <input
              id="tile-rotation"
              type="range"
              min="0"
              max="360"
              step="15"
              bind:value={rotation}
              class="slider"
            />
          </div>

          <div class="form-group">
            <label for="tile-alpha">Opacity: {Math.round(alpha * 100)}%</label>
            <input
              id="tile-alpha"
              type="range"
              min="0"
              max="1"
              step="0.05"
              bind:value={alpha}
              class="slider"
            />
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" bind:checked={hasTint} />
              Enable Tint
            </label>
          </div>

          {#if hasTint}
            <div class="form-group">
              <label for="tile-tint">Tint Color</label>
              <input
                id="tile-tint"
                type="color"
                bind:value={tint}
                class="color-input"
              />
            </div>
          {/if}

          <div class="form-group">
            <label for="tile-z">Z-Index (layer order)</label>
            <input
              id="tile-z"
              type="number"
              bind:value={z}
              step="1"
              class="number-input"
            />
            <p class="help-text">Negative values = below tokens, Positive values = above tokens</p>
          </div>
        </div>

        <!-- Special Options -->
        <div class="form-section">
          <h3 class="section-title">Special Options</h3>

          <div class="form-group">
            <label>
              <input type="checkbox" bind:checked={overhead} />
              Overhead (rendered above tokens)
            </label>
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" bind:checked={roof} />
              Roof (auto-hide when token underneath)
            </label>
          </div>
        </div>

        <!-- Other Settings -->
        <div class="form-section">
          <h3 class="section-title">Options</h3>

          <div class="form-group">
            <label>
              <input type="checkbox" bind:checked={hidden} />
              Hidden
            </label>
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" bind:checked={locked} />
              Locked
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
    max-width: 600px;
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

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #d1d5db;
    margin-bottom: 0.5rem;
  }

  .text-input,
  .number-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    background-color: #111827;
    color: #f9fafb;
    font-size: 0.875rem;
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

  .help-text {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-top: 0.25rem;
    margin-bottom: 0;
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
