<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let settings: {
    opacity: number;
    gridSnap: boolean;
  };

  const dispatch = createEventDispatcher<{
    change: typeof settings;
  }>();

  function handleChange() {
    dispatch('change', settings);
  }
</script>

<div class="tool-settings">
  <h3 class="settings-title">Window Settings</h3>

  <div class="setting-row">
    <label for="window-opacity">
      Opacity: {Math.round(settings.opacity * 100)}%
    </label>
  </div>
  <div class="setting-row slider-row">
    <input
      id="window-opacity"
      type="range"
      bind:value={settings.opacity}
      on:change={handleChange}
      min="0"
      max="1"
      step="0.05"
    />
  </div>

  <div class="setting-row checkbox-row">
    <label>
      <input
        type="checkbox"
        bind:checked={settings.gridSnap}
        on:change={handleChange}
      />
      Grid Snap
    </label>
  </div>
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

  .checkbox-row {
    justify-content: flex-start;
  }

  label {
    font-size: 0.75rem;
    color: #b0b0b0;
    white-space: nowrap;
  }

  .checkbox-row label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    cursor: pointer;
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

  input[type="checkbox"] {
    width: 14px;
    height: 14px;
    cursor: pointer;
    margin: 0;
  }
</style>
