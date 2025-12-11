<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let settings: {
    color: string;
    opacity: number;
    triggerType: 'none' | 'enter' | 'exit' | 'both';
  };

  const dispatch = createEventDispatcher<{
    change: typeof settings;
  }>();

  function handleChange() {
    dispatch('change', settings);
  }
</script>

<div class="tool-settings">
  <h3 class="settings-title">Region Settings</h3>

  <div class="setting-row">
    <label for="region-color">Color</label>
    <input
      id="region-color"
      type="color"
      bind:value={settings.color}
      on:change={handleChange}
    />
  </div>

  <div class="setting-row">
    <label for="region-opacity">
      Opacity: {Math.round(settings.opacity * 100)}%
    </label>
  </div>
  <div class="setting-row slider-row">
    <input
      id="region-opacity"
      type="range"
      bind:value={settings.opacity}
      on:change={handleChange}
      min="0"
      max="1"
      step="0.05"
    />
  </div>

  <div class="setting-row">
    <label for="trigger-type">Trigger</label>
    <select
      id="trigger-type"
      bind:value={settings.triggerType}
      on:change={handleChange}
    >
      <option value="none">None</option>
      <option value="enter">On Enter</option>
      <option value="exit">On Exit</option>
      <option value="both">Both</option>
    </select>
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

  label {
    font-size: 0.75rem;
    color: #b0b0b0;
    white-space: nowrap;
  }

  select,
  input[type="color"] {
    padding: 0.25rem 0.375rem;
    border: 1px solid #333;
    border-radius: 3px;
    background-color: #2a2a2a;
    color: #e0e0e0;
    font-size: 0.75rem;
    min-width: 0;
    flex: 1;
    max-width: 120px;
  }

  input[type="color"] {
    height: 24px;
    padding: 2px;
    cursor: pointer;
  }

  select:focus,
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
