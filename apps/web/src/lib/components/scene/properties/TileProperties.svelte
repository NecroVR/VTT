<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Tile } from '@vtt/shared';

  export let tiles: Tile[] = [];
  export let sceneId: string;
  export let campaignId: string;
  export let isGM: boolean = false;

  const dispatch = createEventDispatcher<{
    change: { objectId: string; property: string; value: any };
    delete: string;
    openFullEditor: Tile;
  }>();

  $: tile = tiles.length === 1 ? tiles[0] : null;
  $: isMultiple = tiles.length > 1;

  function handleChange(property: string, value: any) {
    if (tile) {
      dispatch('change', { objectId: tile.id, property, value });
    }
  }

  function handleDelete() {
    if (tile && confirm('Delete this tile?')) {
      dispatch('delete', tile.id);
    }
  }

  function handleOpenFullEditor() {
    if (tile) {
      dispatch('openFullEditor', tile);
    }
  }
</script>

{#if isMultiple}
  <div class="property-panel">
    <div class="section-header">Multiple Tiles Selected</div>
    <div class="info-text">{tiles.length} tiles selected</div>
    <div class="section">
      <button class="button-full" on:click={() => dispatch('delete', tiles[0].id)}>
        Delete Selected
      </button>
    </div>
  </div>
{:else if tile}
  <div class="property-panel">
    <div class="section-header">Tile Properties</div>

    <!-- Position -->
    <div class="section">
      <div class="section-title">Position</div>
      <div class="input-row">
        <label for="tile-x">
          X
          <input
            id="tile-x"
            type="number"
            value={tile.x}
            step="0.1"
            on:input={(e) => handleChange('x', parseFloat(e.currentTarget.value))}
          />
        </label>
        <label for="tile-y">
          Y
          <input
            id="tile-y"
            type="number"
            value={tile.y}
            step="0.1"
            on:input={(e) => handleChange('y', parseFloat(e.currentTarget.value))}
          />
        </label>
      </div>
    </div>

    <!-- Size -->
    <div class="section">
      <div class="section-title">Size</div>
      <div class="input-row">
        <label for="tile-width">
          Width
          <input
            id="tile-width"
            type="number"
            value={tile.width}
            min="0.1"
            step="0.1"
            on:input={(e) => handleChange('width', parseFloat(e.currentTarget.value))}
          />
        </label>
        <label for="tile-height">
          Height
          <input
            id="tile-height"
            type="number"
            value={tile.height}
            min="0.1"
            step="0.1"
            on:input={(e) => handleChange('height', parseFloat(e.currentTarget.value))}
          />
        </label>
      </div>
    </div>

    <!-- Rotation -->
    <div class="section">
      <label for="tile-rotation">
        Rotation: {tile.rotation}°
        <input
          id="tile-rotation"
          type="range"
          value={tile.rotation}
          min="0"
          max="360"
          step="15"
          on:input={(e) => handleChange('rotation', parseFloat(e.currentTarget.value))}
        />
      </label>
    </div>

    <!-- Z-Index -->
    <div class="section">
      <label for="tile-z">
        Z-Index (Layer)
        <input
          id="tile-z"
          type="number"
          value={tile.z}
          step="1"
          on:input={(e) => handleChange('z', parseFloat(e.currentTarget.value))}
        />
      </label>
      <div class="info-text">Negative = below tokens, Positive = above tokens</div>
    </div>

    <!-- Special Options -->
    <div class="section">
      <label class="checkbox-label">
        <input
          type="checkbox"
          checked={tile.overhead}
          on:change={(e) => handleChange('overhead', e.currentTarget.checked)}
        />
        Overhead (above tokens)
      </label>
    </div>

    <div class="section">
      <label class="checkbox-label">
        <input
          type="checkbox"
          checked={tile.hidden}
          on:change={(e) => handleChange('hidden', e.currentTarget.checked)}
        />
        Hidden
      </label>
    </div>

    <!-- Actions -->
    <div class="section">
      <button class="button-full button-primary" on:click={handleOpenFullEditor}>
        Open Full Editor
      </button>
      {#if isGM}
        <button class="button-full button-danger" on:click={handleDelete}>
          Delete Tile
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .property-panel {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
    background-color: #1e1e1e;
    color: #e0e0e0;
    font-size: 0.875rem;
  }

  .section-header {
    font-size: 1rem;
    font-weight: 600;
    color: #ffffff;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #333;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section-title {
    font-size: 0.8rem;
    font-weight: 500;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .input-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #aaa;
  }

  .checkbox-label {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }

  input[type="number"] {
    width: 100%;
    padding: 0.375rem;
    background-color: #2a2a2a;
    border: 1px solid #404040;
    border-radius: 3px;
    color: #e0e0e0;
    font-size: 0.75rem;
  }

  input[type="number"]:focus {
    outline: none;
    border-color: #4a9eff;
  }

  input[type="range"] {
    width: 100%;
    height: 4px;
    background: #404040;
    border-radius: 2px;
    outline: none;
    -webkit-appearance: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    background: #4a9eff;
    border-radius: 50%;
    cursor: pointer;
  }

  input[type="range"]::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: #4a9eff;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .button-full {
    width: 100%;
    padding: 0.5rem;
    background-color: #333;
    color: #e0e0e0;
    border: 1px solid #404040;
    border-radius: 3px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .button-full:hover {
    background-color: #404040;
  }

  .button-primary {
    background-color: #4a9eff;
    border-color: #4a9eff;
    color: #ffffff;
  }

  .button-primary:hover {
    background-color: #3a8eef;
  }

  .button-danger {
    background-color: #ef4444;
    border-color: #ef4444;
    color: #ffffff;
  }

  .button-danger:hover {
    background-color: #dc2626;
  }

  .info-text {
    font-size: 0.75rem;
    color: #aaa;
    font-style: italic;
  }
</style>
