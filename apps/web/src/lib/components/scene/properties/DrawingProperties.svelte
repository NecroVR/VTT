<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Drawing } from '@vtt/shared';

  export let drawings: Drawing[] = [];
  export let sceneId: string;
  export let campaignId: string;
  export let isGM: boolean = false;

  const dispatch = createEventDispatcher<{
    change: { objectId: string; property: string; value: any };
    delete: string;
  }>();

  $: drawing = drawings.length === 1 ? drawings[0] : null;
  $: isMultiple = drawings.length > 1;

  function handleChange(property: string, value: any) {
    if (drawing) {
      dispatch('change', { objectId: drawing.id, property, value });
    }
  }

  function handleDelete() {
    if (drawing && confirm('Delete this drawing?')) {
      dispatch('delete', drawing.id);
    }
  }
</script>

{#if isMultiple}
  <div class="property-panel">
    <div class="section-header">Multiple Drawings Selected</div>
    <div class="info-text">{drawings.length} drawings selected</div>
    <div class="section">
      <button class="button-full" on:click={() => dispatch('delete', drawings[0].id)}>
        Delete Selected
      </button>
    </div>
  </div>
{:else if drawing}
  <div class="property-panel">
    <div class="section-header">Drawing Properties</div>

    <!-- Position -->
    <div class="section">
      <div class="section-title">Position</div>
      <div class="input-row">
        <label for="drawing-x">
          X
          <input
            id="drawing-x"
            type="number"
            value={drawing.x}
            step="1"
            on:input={(e) => handleChange('x', parseFloat(e.currentTarget.value))}
          />
        </label>
        <label for="drawing-y">
          Y
          <input
            id="drawing-y"
            type="number"
            value={drawing.y}
            step="1"
            on:input={(e) => handleChange('y', parseFloat(e.currentTarget.value))}
          />
        </label>
      </div>
    </div>

    <!-- Stroke -->
    <div class="section">
      <div class="section-title">Stroke</div>
      <div class="input-row">
        <label for="drawing-stroke-color">
          Color
          <input
            id="drawing-stroke-color"
            type="color"
            value={drawing.strokeColor}
            on:input={(e) => handleChange('strokeColor', e.currentTarget.value)}
          />
        </label>
        <label for="drawing-stroke-width">
          Width
          <input
            id="drawing-stroke-width"
            type="number"
            value={drawing.strokeWidth}
            min="1"
            max="20"
            step="1"
            on:input={(e) => handleChange('strokeWidth', parseFloat(e.currentTarget.value))}
          />
        </label>
      </div>
    </div>

    <!-- Fill -->
    {#if drawing.fillColor}
      <div class="section">
        <div class="section-title">Fill</div>
        <div class="input-row">
          <label for="drawing-fill-color">
            Color
            <input
              id="drawing-fill-color"
              type="color"
              value={drawing.fillColor}
              on:input={(e) => handleChange('fillColor', e.currentTarget.value)}
            />
          </label>
          <label for="drawing-fill-alpha">
            Opacity: {Math.round(drawing.fillAlpha * 100)}%
            <input
              id="drawing-fill-alpha"
              type="range"
              value={drawing.fillAlpha}
              min="0"
              max="1"
              step="0.05"
              on:input={(e) => handleChange('fillAlpha', parseFloat(e.currentTarget.value))}
            />
          </label>
        </div>
      </div>
    {/if}

    <!-- Text Content (if text drawing) -->
    {#if drawing.drawingType === 'text' && drawing.text !== null && drawing.text !== undefined}
      <div class="section">
        <label for="drawing-text">
          Text Content
          <textarea
            id="drawing-text"
            value={drawing.text}
            rows="3"
            on:input={(e) => handleChange('text', e.currentTarget.value)}
          ></textarea>
        </label>
      </div>

      <div class="section">
        <label for="drawing-font-size">
          Font Size
          <input
            id="drawing-font-size"
            type="number"
            value={drawing.fontSize || 16}
            min="8"
            max="72"
            step="1"
            on:input={(e) => handleChange('fontSize', parseFloat(e.currentTarget.value))}
          />
        </label>
      </div>
    {/if}

    <!-- Locked -->
    <div class="section">
      <label class="checkbox-label">
        <input
          type="checkbox"
          checked={drawing.locked}
          on:change={(e) => handleChange('locked', e.currentTarget.checked)}
        />
        Locked
      </label>
    </div>

    <!-- Actions -->
    <div class="section">
      {#if isGM}
        <button class="button-full button-danger" on:click={handleDelete}>
          Delete Drawing
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

  input[type="number"],
  textarea {
    width: 100%;
    padding: 0.375rem;
    background-color: #2a2a2a;
    border: 1px solid #404040;
    border-radius: 3px;
    color: #e0e0e0;
    font-size: 0.75rem;
  }

  input[type="number"]:focus,
  textarea:focus {
    outline: none;
    border-color: #4a9eff;
  }

  textarea {
    resize: vertical;
    font-family: inherit;
  }

  input[type="color"] {
    width: 100%;
    height: 32px;
    padding: 2px;
    background-color: #2a2a2a;
    border: 1px solid #404040;
    border-radius: 3px;
    cursor: pointer;
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
