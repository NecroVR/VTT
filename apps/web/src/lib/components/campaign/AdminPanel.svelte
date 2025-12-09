<script lang="ts">
  import { campaignsStore } from '$lib/stores/campaigns';
  import { scenesStore } from '$lib/stores/scenes';
  import { assetsStore } from '$lib/stores/assets';
  import { AssetPicker } from '$lib/components/assets';
  import type { Asset } from '@vtt/shared';

  export let campaignId: string;

  let error: string | null = null;
  let saving = false;

  // Read settings from the campaigns store (reactive)
  $: currentCampaign = $campaignsStore.currentCampaign;
  $: snapToGrid = currentCampaign?.settings?.snapToGrid ?? false;
  $: loading = $campaignsStore.loading;

  // Read active scene from scenes store (reactive)
  $: activeScene = $scenesStore.activeSceneId
    ? $scenesStore.scenes.get($scenesStore.activeSceneId)
    : null;

  // Scene grid settings (reactive)
  $: gridVisible = activeScene?.gridVisible ?? true;
  $: gridType = activeScene?.gridType ?? 'square';
  $: gridColor = activeScene?.gridColor ?? '#000000';
  $: gridLineWidth = activeScene?.gridLineWidth ?? 1;
  $: gridAlpha = activeScene?.gridAlpha ?? 0.2;
  $: gridWidth = activeScene?.gridWidth ?? 100;
  $: gridHeight = activeScene?.gridHeight ?? 100;

  // Scene background settings (reactive)
  $: backgroundImage = activeScene?.backgroundImage ?? null;
  $: backgroundWidth = activeScene?.backgroundWidth ?? null;
  $: backgroundHeight = activeScene?.backgroundHeight ?? null;

  // Scene lighting & vision settings (reactive)
  $: globalLight = activeScene?.globalLight ?? true;
  $: darkness = activeScene?.darkness ?? 0;
  $: tokenVision = activeScene?.tokenVision ?? true;
  $: fogExploration = activeScene?.fogExploration ?? true;

  // Asset picker state
  let showAssetPicker = false;

  // Grid dimension linking
  let linkGridDimensions = true;

  async function handleToggleSnapToGrid() {
    saving = true;
    error = null;

    try {
      // Use the store's updateCampaign method - this updates currentCampaign
      const success = await campaignsStore.updateCampaign(campaignId, {
        settings: {
          snapToGrid: !snapToGrid,
        },
      });

      if (!success) {
        throw new Error('Failed to update settings');
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
      error = 'Failed to save settings';
    } finally {
      saving = false;
    }
  }

  async function updateSceneGridSetting(updates: Record<string, any>) {
    if (!activeScene) return;

    saving = true;
    error = null;

    try {
      const success = await scenesStore.updateSceneApi(activeScene.id, updates);

      if (!success) {
        throw new Error('Failed to update scene settings');
      }
    } catch (err) {
      console.error('Failed to update scene settings:', err);
      error = 'Failed to save scene settings';
    } finally {
      saving = false;
    }
  }

  async function handleToggleGridVisible() {
    await updateSceneGridSetting({ gridVisible: !gridVisible });
  }

  async function handleGridTypeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    await updateSceneGridSetting({ gridType: target.value });
  }

  async function handleGridColorChange(event: Event) {
    const target = event.target as HTMLInputElement;
    await updateSceneGridSetting({ gridColor: target.value });
  }

  async function handleGridLineWidthChange(event: Event) {
    const target = event.target as HTMLInputElement;
    await updateSceneGridSetting({ gridLineWidth: parseFloat(target.value) });
  }

  // Debounce timer for slider changes
  let opacityDebounceTimer: number | null = null;
  let darknessDebounceTimer: number | null = null;

  // Local state for sliders (for immediate UI updates)
  let localGridAlpha = 0;
  let localDarkness = 0;

  // Sync local state with store values
  $: localGridAlpha = gridAlpha;
  $: localDarkness = darkness;

  async function handleGridOpacityChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = parseFloat(target.value) / 100;

    // Update local state immediately for smooth UI
    localGridAlpha = newValue;

    // Debounce API call
    if (opacityDebounceTimer) {
      clearTimeout(opacityDebounceTimer);
    }
    opacityDebounceTimer = window.setTimeout(async () => {
      await updateSceneGridSetting({ gridAlpha: newValue });
    }, 150);
  }

  async function handleToggleGlobalLight() {
    await updateSceneGridSetting({ globalLight: !globalLight });
  }

  async function handleDarknessChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = parseFloat(target.value) / 100;

    // Update local state immediately for smooth UI
    localDarkness = newValue;

    // Debounce API call
    if (darknessDebounceTimer) {
      clearTimeout(darknessDebounceTimer);
    }
    darknessDebounceTimer = window.setTimeout(async () => {
      await updateSceneGridSetting({ darkness: newValue });
    }, 150);
  }

  async function handleToggleTokenVision() {
    await updateSceneGridSetting({ tokenVision: !tokenVision });
  }

  async function handleToggleFogExploration() {
    await updateSceneGridSetting({ fogExploration: !fogExploration });
  }

  // Background image handlers
  function handleSelectBackground() {
    showAssetPicker = true;
  }

  async function handleAssetSelect(event: CustomEvent<{ asset: Asset; url: string }>) {
    const { asset, url } = event.detail;

    await updateSceneGridSetting({
      backgroundImage: url,
      backgroundWidth: asset.width ?? null,
      backgroundHeight: asset.height ?? null,
    });

    showAssetPicker = false;
  }

  function handleAssetPickerCancel() {
    showAssetPicker = false;
  }

  async function handleClearBackground() {
    if (confirm('Are you sure you want to remove the background image?')) {
      await updateSceneGridSetting({
        backgroundImage: null,
        backgroundWidth: null,
        backgroundHeight: null,
      });
    }
  }

  // Grid dimension handlers - use focus/blur to track editing state
  let localGridWidth = 100;
  let localGridHeight = 100;
  let isEditingGridWidth = false;
  let isEditingGridHeight = false;
  let gridDimensionDebounceTimer: number | null = null;

  // Sync local state with store values ONLY when not editing
  $: if (!isEditingGridWidth && gridWidth !== undefined) {
    localGridWidth = gridWidth;
  }
  $: if (!isEditingGridHeight && gridHeight !== undefined) {
    localGridHeight = gridHeight;
  }

  function handleGridWidthFocus() {
    isEditingGridWidth = true;
  }

  function handleGridHeightFocus() {
    isEditingGridHeight = true;
  }

  function handleGridWidthInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = parseInt(target.value, 10);
    if (!isNaN(newValue) && activeScene) {
      localGridWidth = newValue;
      const updates: Record<string, number> = { gridWidth: newValue };
      if (linkGridDimensions) {
        localGridHeight = newValue;
        updates.gridHeight = newValue;
      }
      // Update store immediately for instant grid rendering
      scenesStore.updateScene(activeScene.id, updates);
      // Debounce the API call for persistence
      debouncedGridDimensionSave(updates);
    }
  }

  function handleGridHeightInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = parseInt(target.value, 10);
    if (!isNaN(newValue) && activeScene) {
      localGridHeight = newValue;
      const updates: Record<string, number> = { gridHeight: newValue };
      if (linkGridDimensions) {
        localGridWidth = newValue;
        updates.gridWidth = newValue;
      }
      // Update store immediately for instant grid rendering
      scenesStore.updateScene(activeScene.id, updates);
      // Debounce the API call for persistence
      debouncedGridDimensionSave(updates);
    }
  }

  function debouncedGridDimensionSave(updates: Record<string, number>) {
    if (gridDimensionDebounceTimer) {
      clearTimeout(gridDimensionDebounceTimer);
    }
    gridDimensionDebounceTimer = window.setTimeout(async () => {
      await updateSceneGridSetting(updates);
    }, 300);
  }

  function handleGridWidthBlur() {
    isEditingGridWidth = false;
  }

  function handleGridHeightBlur() {
    isEditingGridHeight = false;
  }
</script>

<div class="admin-panel">
  <div class="panel-header">
    <h2>Campaign Settings</h2>
  </div>

  <div class="panel-content">
    {#if loading}
      <div class="loading">Loading settings...</div>
    {:else if error}
      <div class="error-message">{error}</div>
    {:else}
      <section class="settings-section">
        <h3>Grid Settings</h3>

        <div class="setting-item">
          <div class="setting-info">
            <label for="snap-to-grid">Grid Snapping</label>
            <p class="setting-description">
              When enabled, tokens automatically snap to the center of grid cells when dropped
            </p>
          </div>
          <label class="toggle-switch">
            <input
              id="snap-to-grid"
              type="checkbox"
              checked={snapToGrid}
              disabled={saving}
              on:change={handleToggleSnapToGrid}
            />
            <span class="slider"></span>
          </label>
        </div>
      </section>

      <section class="settings-section">
        <h3>Scene Background</h3>

        {#if !activeScene}
          <div class="no-scene-message">
            No active scene selected. Please select or create a scene to configure its settings.
          </div>
        {:else}
          <div class="scene-header">
            <h4>{activeScene.name}</h4>
          </div>

          {#if backgroundImage}
            <div class="background-preview">
              <img src={backgroundImage} alt="Scene background" />
              <div class="background-info">
                {#if backgroundWidth && backgroundHeight}
                  <span class="background-dimensions">{backgroundWidth} x {backgroundHeight} px</span>
                {/if}
              </div>
            </div>
          {:else}
            <div class="no-background-message">
              No background image set for this scene
            </div>
          {/if}

          <div class="background-buttons">
            <button
              class="button-select-background"
              on:click={handleSelectBackground}
              disabled={saving}
            >
              {backgroundImage ? 'Change Background' : 'Select Background'}
            </button>
            {#if backgroundImage}
              <button
                class="button-clear-background"
                on:click={handleClearBackground}
                disabled={saving}
              >
                Clear Background
              </button>
            {/if}
          </div>
        {/if}
      </section>

      <section class="settings-section">
        <h3>Scene Settings</h3>

        {#if !activeScene}
          <div class="no-scene-message">
            No active scene selected. Please select or create a scene to configure its settings.
          </div>
        {:else}
          <div class="scene-header">
            <h4>{activeScene.name}</h4>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label for="grid-visible">Grid Visible</label>
              <p class="setting-description">
                Show or hide the grid overlay on the scene
              </p>
            </div>
            <label class="toggle-switch">
              <input
                id="grid-visible"
                type="checkbox"
                checked={gridVisible}
                disabled={saving}
                on:change={handleToggleGridVisible}
              />
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label for="grid-type">Grid Shape</label>
              <p class="setting-description">
                Choose between square or hexagonal grid
              </p>
            </div>
            <select
              id="grid-type"
              class="setting-select"
              value={gridType}
              disabled={saving || !gridVisible}
              on:change={handleGridTypeChange}
            >
              <option value="square">Square</option>
              <option value="hex">Hexagonal</option>
            </select>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label for="grid-color">Grid Color</label>
              <p class="setting-description">
                Color of the grid lines
              </p>
            </div>
            <input
              id="grid-color"
              type="color"
              class="setting-color"
              value={gridColor}
              disabled={saving || !gridVisible}
              on:change={handleGridColorChange}
            />
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label for="grid-line-width">Grid Line Width</label>
              <p class="setting-description">
                Thickness of the grid lines (1-5 pixels)
              </p>
            </div>
            <input
              id="grid-line-width"
              type="number"
              class="setting-number"
              min="1"
              max="5"
              step="0.5"
              value={gridLineWidth}
              disabled={saving || !gridVisible}
              on:change={handleGridLineWidthChange}
            />
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label for="grid-opacity">Grid Opacity</label>
              <p class="setting-description">
                Transparency of the grid lines (0-100%)
              </p>
            </div>
            <div class="setting-range-container">
              <input
                id="grid-opacity"
                type="range"
                class="setting-range"
                min="0"
                max="100"
                step="1"
                value={localGridAlpha * 100}
                disabled={saving || !gridVisible}
                on:input={handleGridOpacityChange}
              />
              <span class="setting-range-value">{Math.round(localGridAlpha * 100)}%</span>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label>Grid Cell Dimensions</label>
              <p class="setting-description">
                Size of each grid cell in pixels
              </p>
            </div>
            <div class="grid-dimensions-controls">
              <div class="dimension-input">
                <label for="grid-width" class="dimension-label">Width</label>
                <input
                  id="grid-width"
                  type="number"
                  class="setting-number"
                  min="10"
                  max="500"
                  step="5"
                  value={localGridWidth}
                  disabled={saving || !gridVisible}
                  on:focus={handleGridWidthFocus}
                  on:input={handleGridWidthInput}
                  on:blur={handleGridWidthBlur}
                />
              </div>
              <div class="dimension-link">
                <label class="toggle-switch-small">
                  <input
                    type="checkbox"
                    bind:checked={linkGridDimensions}
                    disabled={saving || !gridVisible}
                  />
                  <span class="slider-small"></span>
                </label>
                <span class="link-label">Link</span>
              </div>
              <div class="dimension-input">
                <label for="grid-height" class="dimension-label">Height</label>
                <input
                  id="grid-height"
                  type="number"
                  class="setting-number"
                  min="10"
                  max="500"
                  step="5"
                  value={localGridHeight}
                  disabled={saving || !gridVisible}
                  on:focus={handleGridHeightFocus}
                  on:input={handleGridHeightInput}
                  on:blur={handleGridHeightBlur}
                />
              </div>
            </div>
          </div>
        {/if}
      </section>

      <section class="settings-section">
        <h3>Lighting & Vision</h3>

        {#if !activeScene}
          <div class="no-scene-message">
            No active scene selected. Please select or create a scene to configure its settings.
          </div>
        {:else}
          <div class="setting-item">
            <div class="setting-info">
              <label for="global-light">Global Illumination</label>
              <p class="setting-description">
                When enabled, the entire scene is lit. When disabled, only areas within light sources and token vision are visible.
              </p>
            </div>
            <label class="toggle-switch">
              <input
                id="global-light"
                type="checkbox"
                checked={globalLight}
                disabled={saving}
                on:change={handleToggleGlobalLight}
              />
              <span class="slider"></span>
            </label>
          </div>

          {#if !globalLight}
            <div class="setting-item">
              <div class="setting-info">
                <label for="darkness-level">Darkness Level</label>
                <p class="setting-description">
                  Control the darkness level of the scene (0% = no darkness, 100% = full darkness)
                </p>
              </div>
              <div class="setting-range-container">
                <input
                  id="darkness-level"
                  type="range"
                  class="setting-range"
                  min="0"
                  max="100"
                  step="1"
                  value={localDarkness * 100}
                  disabled={saving}
                  on:input={handleDarknessChange}
                />
                <span class="setting-range-value">{Math.round(localDarkness * 100)}%</span>
              </div>
            </div>
          {/if}

          <div class="setting-item">
            <div class="setting-info">
              <label for="token-vision">Token Vision</label>
              <p class="setting-description">
                Enable vision for tokens with vision ranges set
              </p>
            </div>
            <label class="toggle-switch">
              <input
                id="token-vision"
                type="checkbox"
                checked={tokenVision}
                disabled={saving}
                on:change={handleToggleTokenVision}
              />
              <span class="slider"></span>
            </label>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <label for="fog-exploration">Fog Exploration</label>
              <p class="setting-description">
                Allow token vision to reveal fog of war
              </p>
            </div>
            <label class="toggle-switch">
              <input
                id="fog-exploration"
                type="checkbox"
                checked={fogExploration}
                disabled={saving}
                on:change={handleToggleFogExploration}
              />
              <span class="slider"></span>
            </label>
          </div>
        {/if}
      </section>
    {/if}
  </div>
</div>

<!-- Asset Picker Modal -->
<AssetPicker
  bind:isOpen={showAssetPicker}
  {campaignId}
  allowedTypes={['map']}
  title="Select Scene Background"
  on:select={handleAssetSelect}
  on:cancel={handleAssetPickerCancel}
/>

<style>
  .admin-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #1f2937;
    color: #e5e7eb;
    overflow: hidden;
  }

  .panel-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #374151;
    flex-shrink: 0;
  }

  .panel-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #f3f4f6;
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.5rem;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #9ca3af;
  }

  .error-message {
    padding: 0.75rem;
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    border-radius: 4px;
    color: #ef4444;
    font-size: 0.875rem;
  }

  .settings-section {
    margin-bottom: 2rem;
  }

  .settings-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #f3f4f6;
    border-bottom: 1px solid #374151;
    padding-bottom: 0.5rem;
  }

  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem;
    background-color: #111827;
    border: 1px solid #374151;
    border-radius: 6px;
  }

  .setting-info {
    flex: 1;
  }

  .setting-info label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #f3f4f6;
    margin-bottom: 0.25rem;
    cursor: pointer;
  }

  .setting-description {
    margin: 0;
    font-size: 0.75rem;
    color: #9ca3af;
    line-height: 1.4;
  }

  /* Toggle Switch Styles */
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 24px;
    flex-shrink: 0;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #374151;
    transition: 0.3s;
    border-radius: 24px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: #9ca3af;
    transition: 0.3s;
    border-radius: 50%;
  }

  input:checked + .slider {
    background-color: #3b82f6;
  }

  input:checked + .slider:before {
    background-color: white;
    transform: translateX(24px);
  }

  input:disabled + .slider {
    opacity: 0.5;
    cursor: not-allowed;
  }

  input:focus + .slider {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }

  /* Hover effects */
  .slider:hover {
    background-color: #4b5563;
  }

  input:checked + .slider:hover {
    background-color: #2563eb;
  }

  /* Scene Settings Styles */
  .no-scene-message {
    padding: 1rem;
    text-align: center;
    color: #9ca3af;
    font-size: 0.875rem;
    font-style: italic;
  }

  .scene-header {
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #374151;
  }

  .scene-header h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 500;
    color: #60a5fa;
  }

  .setting-select {
    padding: 0.5rem;
    background-color: #111827;
    border: 1px solid #374151;
    border-radius: 4px;
    color: #f3f4f6;
    font-size: 0.875rem;
    cursor: pointer;
    min-width: 120px;
  }

  .setting-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .setting-select:hover:not(:disabled) {
    border-color: #4b5563;
  }

  .setting-select:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .setting-color {
    width: 60px;
    height: 36px;
    padding: 2px;
    background-color: #111827;
    border: 1px solid #374151;
    border-radius: 4px;
    cursor: pointer;
  }

  .setting-color:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .setting-color:hover:not(:disabled) {
    border-color: #4b5563;
  }

  .setting-number {
    width: 80px;
    padding: 0.5rem;
    background-color: #111827;
    border: 1px solid #374151;
    border-radius: 4px;
    color: #f3f4f6;
    font-size: 0.875rem;
  }

  .setting-number:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .setting-number:hover:not(:disabled) {
    border-color: #4b5563;
  }

  .setting-number:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .setting-range-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .setting-range {
    flex: 1;
    height: 6px;
    background-color: #374151;
    border-radius: 3px;
    outline: none;
    -webkit-appearance: none;
  }

  .setting-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background-color: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
  }

  .setting-range::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background-color: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }

  .setting-range:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .setting-range:disabled::-webkit-slider-thumb {
    cursor: not-allowed;
  }

  .setting-range:disabled::-moz-range-thumb {
    cursor: not-allowed;
  }

  .setting-range-value {
    min-width: 45px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #f3f4f6;
    text-align: right;
  }

  /* Background image styles */
  .background-preview {
    margin-bottom: 1rem;
    border: 1px solid #374151;
    border-radius: 6px;
    overflow: hidden;
    background-color: #111827;
  }

  .background-preview img {
    width: 100%;
    height: 150px;
    object-fit: cover;
    display: block;
  }

  .background-info {
    padding: 0.5rem;
    background-color: rgba(0, 0, 0, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .background-dimensions {
    font-size: 0.75rem;
    color: #9ca3af;
    font-weight: 500;
  }

  .no-background-message {
    padding: 2rem 1rem;
    text-align: center;
    color: #9ca3af;
    font-size: 0.875rem;
    font-style: italic;
    background-color: #111827;
    border: 1px dashed #374151;
    border-radius: 6px;
    margin-bottom: 1rem;
  }

  .background-buttons {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .button-select-background,
  .button-clear-background {
    flex: 1;
    min-width: 120px;
    padding: 0.75rem 1rem;
    border: 1px solid #374151;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s;
  }

  .button-select-background {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .button-select-background:hover:not(:disabled) {
    background-color: #2563eb;
    border-color: #2563eb;
  }

  .button-select-background:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button-clear-background {
    background-color: transparent;
    color: #ef4444;
    border-color: #ef4444;
  }

  .button-clear-background:hover:not(:disabled) {
    background-color: rgba(239, 68, 68, 0.1);
  }

  .button-clear-background:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Grid dimension controls */
  .grid-dimensions-controls {
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;
  }

  .dimension-input {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .dimension-label {
    font-size: 0.75rem;
    color: #9ca3af;
    font-weight: 500;
  }

  .dimension-link {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding-bottom: 0.5rem;
  }

  .link-label {
    font-size: 0.625rem;
    color: #9ca3af;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Small toggle switch for link button */
  .toggle-switch-small {
    position: relative;
    display: inline-block;
    width: 36px;
    height: 20px;
    flex-shrink: 0;
  }

  .toggle-switch-small input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider-small {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #374151;
    transition: 0.3s;
    border-radius: 20px;
  }

  .slider-small:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 3px;
    bottom: 3px;
    background-color: #9ca3af;
    transition: 0.3s;
    border-radius: 50%;
  }

  input:checked + .slider-small {
    background-color: #3b82f6;
  }

  input:checked + .slider-small:before {
    background-color: white;
    transform: translateX(16px);
  }

  input:disabled + .slider-small {
    opacity: 0.5;
    cursor: not-allowed;
  }

  input:focus + .slider-small {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }

  .slider-small:hover {
    background-color: #4b5563;
  }

  input:checked + .slider-small:hover {
    background-color: #2563eb;
  }
</style>
