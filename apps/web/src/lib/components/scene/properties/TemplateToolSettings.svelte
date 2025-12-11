<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let settings: {
    templateType: 'cone' | 'circle' | 'rectangle' | 'ray';
    size: number;
    color: string;
  };

  const dispatch = createEventDispatcher<{
    change: typeof settings;
  }>();

  function handleChange() {
    dispatch('change', settings);
  }
</script>

<div class="tool-settings">
  <h3 class="settings-title">Template Settings</h3>

  <div class="setting-row">
    <label for="template-type">Type</label>
    <select
      id="template-type"
      bind:value={settings.templateType}
      on:change={handleChange}
    >
      <option value="cone">Cone</option>
      <option value="circle">Circle</option>
      <option value="rectangle">Rectangle</option>
      <option value="ray">Ray</option>
    </select>
  </div>

  <div class="setting-row">
    <label for="template-size">Size</label>
    <input
      id="template-size"
      type="number"
      bind:value={settings.size}
      on:change={handleChange}
      min="1"
      step="1"
    />
  </div>

  <div class="setting-row">
    <label for="template-color">Color</label>
    <input
      id="template-color"
      type="color"
      bind:value={settings.color}
      on:change={handleChange}
    />
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
</style>
