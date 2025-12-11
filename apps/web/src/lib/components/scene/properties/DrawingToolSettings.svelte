<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let settings: {
    strokeColor: string;
    strokeWidth: number;
    fillColor: string;
    fillOpacity: number;
    fontSize?: number;
    fontFamily?: string;
  };

  export let drawingType: 'freehand' | 'rectangle' | 'circle' | 'text' = 'freehand';

  const dispatch = createEventDispatcher<{
    change: typeof settings;
  }>();

  function handleChange() {
    dispatch('change', settings);
  }
</script>

<div class="tool-settings">
  <h3 class="settings-title">Drawing Settings</h3>

  <div class="setting-row">
    <label for="stroke-color">Stroke Color</label>
    <input
      id="stroke-color"
      type="color"
      bind:value={settings.strokeColor}
      on:change={handleChange}
    />
  </div>

  <div class="setting-row">
    <label for="stroke-width">
      Stroke Width: {settings.strokeWidth}px
    </label>
  </div>
  <div class="setting-row slider-row">
    <input
      id="stroke-width"
      type="range"
      bind:value={settings.strokeWidth}
      on:change={handleChange}
      min="1"
      max="20"
      step="1"
    />
  </div>

  {#if drawingType !== 'freehand' && drawingType !== 'text'}
    <div class="setting-row">
      <label for="fill-color">Fill Color</label>
      <input
        id="fill-color"
        type="color"
        bind:value={settings.fillColor}
        on:change={handleChange}
      />
    </div>

    <div class="setting-row">
      <label for="fill-opacity">
        Fill Opacity: {Math.round(settings.fillOpacity * 100)}%
      </label>
    </div>
    <div class="setting-row slider-row">
      <input
        id="fill-opacity"
        type="range"
        bind:value={settings.fillOpacity}
        on:change={handleChange}
        min="0"
        max="1"
        step="0.05"
      />
    </div>
  {/if}

  {#if drawingType === 'text'}
    <div class="setting-row">
      <label for="font-size">Font Size</label>
      <input
        id="font-size"
        type="number"
        bind:value={settings.fontSize}
        on:change={handleChange}
        min="8"
        max="72"
        step="1"
      />
    </div>

    <div class="setting-row">
      <label for="font-family">Font</label>
      <select
        id="font-family"
        bind:value={settings.fontFamily}
        on:change={handleChange}
      >
        <option value="Arial">Arial</option>
        <option value="Helvetica">Helvetica</option>
        <option value="Times New Roman">Times</option>
        <option value="Courier New">Courier</option>
        <option value="Georgia">Georgia</option>
        <option value="Verdana">Verdana</option>
      </select>
    </div>
  {/if}
</div>

<style>
  .tool-settings {
    padding: 0.75rem;
    background-color: #1e1e1e;
    border-radius: 4px;
  }

  .settings-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #e0e0e0;
    margin: 0 0 0.75rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #333;
  }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .setting-row:last-child {
    margin-bottom: 0;
  }

  .slider-row {
    margin-bottom: 0.75rem;
  }

  label {
    font-size: 0.75rem;
    color: #b0b0b0;
    white-space: nowrap;
  }

  select,
  input[type="number"],
  input[type="color"] {
    padding: 0.25rem 0.375rem;
    border: 1px solid #333;
    border-radius: 3px;
    background-color: #2a2a2a;
    color: #e0e0e0;
    font-size: 0.75rem;
    min-width: 0;
    flex: 1;
  }

  input[type="color"] {
    height: 24px;
    padding: 2px;
    cursor: pointer;
  }

  select:focus,
  input[type="number"]:focus,
  input[type="color"]:focus {
    outline: none;
    border-color: #4a9eff;
  }

  input[type="range"] {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #333;
    outline: none;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #4a9eff;
    cursor: pointer;
  }

  input[type="range"]::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #4a9eff;
    cursor: pointer;
    border: none;
  }
</style>
