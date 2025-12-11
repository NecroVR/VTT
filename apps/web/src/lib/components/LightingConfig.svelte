<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { AmbientLight } from '@vtt/shared';
  import { websocket } from '$stores/websocket';
  import { assembledPaths } from '$lib/stores/paths';

  // Props
  export let isOpen: boolean = false;
  export let light: AmbientLight | null = null;
  export let sceneId: string;
  export let defaultX: number = 0;
  export let defaultY: number = 0;
  export let token: string = '';

  // Get available paths for this scene
  $: availablePaths = $assembledPaths.filter(p => p.sceneId === sceneId);

  const dispatch = createEventDispatcher<{
    close: void;
    save: AmbientLight;
    delete: string;
  }>();

  // Determine if this is a new light or editing existing
  const isNewLight = !light;

  // Form state
  let formData = {
    x: light?.x ?? defaultX,
    y: light?.y ?? defaultY,
    rotation: light?.rotation ?? 0,
    bright: light?.bright ?? 20,
    dim: light?.dim ?? 40,
    angle: light?.angle ?? 360,
    color: light?.color ?? '#ffffff',
    alpha: light?.alpha ?? 0.5,
    animationType: light?.animationType ?? null,
    animationSpeed: light?.animationSpeed ?? 5,
    animationIntensity: light?.animationIntensity ?? 5,
    animationReverse: light?.animationReverse ?? false,
    walls: light?.walls ?? true,
    vision: light?.vision ?? false,
    snapToGrid: light?.snapToGrid ?? false,
    // Foundry VTT Advanced Settings
    hidden: light?.hidden ?? false,
    elevation: light?.elevation ?? 0,
    priority: light?.priority ?? 0,
    negative: light?.negative ?? false,
    attenuation: light?.attenuation ?? 0.5,
    luminosity: light?.luminosity ?? 0.5,
    saturation: light?.saturation ?? 0,
    contrast: light?.contrast ?? 0,
    shadows: light?.shadows ?? 0,
    coloration: light?.coloration ?? 1,
    darknessMin: light?.darknessMin ?? 0,
    darknessMax: light?.darknessMax ?? 1,
    // Animation-specific data (e.g., sparkle configuration)
    data: light?.data ?? {},
    // Path following
    followPathName: light?.followPathName ?? null,
    pathSpeed: light?.pathSpeed ?? 50,
  };

  // Local state for sparkle sliders (for immediate UI feedback)
  let sparkleCount = formData.data?.sparkleCount ?? 10;
  let sparkleSize = formData.data?.sparkleSize ?? 3;
  let sparkleLifetime = formData.data?.sparkleLifetime ?? 1000;

  // Sync sparkle values back to formData when they change
  $: if (formData.animationType === 'sparkle') {
    formData.data = {
      ...formData.data,
      sparkleCount,
      sparkleSize,
      sparkleLifetime,
    };
  }

  // Animation types
  const animationTypes = [
    { value: null, label: 'None' },
    { value: 'torch', label: 'Torch / Flicker' },
    { value: 'pulse', label: 'Pulse' },
    { value: 'chroma', label: 'Chroma' },
    { value: 'wave', label: 'Wave' },
    { value: 'sparkle', label: 'Sparkle' },
  ];

  // Coloration modes
  const colorationModes = [
    { value: 0, label: 'Legacy' },
    { value: 1, label: 'Additive' },
    { value: 2, label: 'Screen' },
    { value: 3, label: 'Overlay' },
    { value: 4, label: 'Color Dodge' },
    { value: 5, label: 'Color Burn' },
    { value: 6, label: 'Hard Light' },
    { value: 7, label: 'Soft Light' },
    { value: 8, label: 'Difference' },
    { value: 9, label: 'Exclusion' },
  ];

  async function handleSave() {
    try {
      const lightData = {
        sceneId,
        ...formData,
      };

      if (isNewLight) {
        // Create new light via REST API
        const response = await fetch(`/api/v1/scenes/${sceneId}/lights`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(lightData),
        });

        if (!response.ok) {
          throw new Error('Failed to create light');
        }

        const data = await response.json();

        // Broadcast via WebSocket for real-time sync
        websocket.sendLightAdd(lightData);

        dispatch('save', data.ambientLight);
      } else {
        // Update existing light via REST API
        const response = await fetch(`/api/v1/lights/${light!.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error('Failed to update light');
        }

        const data = await response.json();

        // Broadcast via WebSocket for real-time sync
        websocket.sendLightUpdate({
          lightId: light!.id,
          updates: formData,
        });

        dispatch('save', data.ambientLight);
      }

      dispatch('close');
    } catch (error) {
      console.error('Failed to save light:', error);
      alert('Failed to save light. Please try again.');
    }
  }

  function handleCancel() {
    dispatch('close');
  }

  async function handleDelete() {
    if (!light) return;

    if (confirm('Are you sure you want to delete this light?')) {
      try {
        const response = await fetch(`/api/v1/lights/${light.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete light');
        }

        // Broadcast via WebSocket for real-time sync
        websocket.sendLightRemove({ lightId: light.id });

        dispatch('delete', light.id);
        dispatch('close');
      } catch (error) {
        console.error('Failed to delete light:', error);
        alert('Failed to delete light. Please try again.');
      }
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel();
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }

  // Calculate preview gradient for light visualization
  $: previewGradient = `radial-gradient(circle, ${formData.color}${Math.round(formData.alpha * 255).toString(16).padStart(2, '0')} 0%, ${formData.color}80 ${(formData.bright / formData.dim) * 100}%, transparent 100%)`;

  // Handle escape key globally when modal is open
  function handleWindowKeydown(event: KeyboardEvent) {
    if (isOpen) {
      handleKeydown(event);
    }
  }
</script>

<svelte:window on:keydown={handleWindowKeydown} />

{#if isOpen}
  <div class="modal-backdrop" on:click={handleBackdropClick}>
    <div class="modal-content" on:click|stopPropagation>
      <header class="modal-header">
        <h2>{isNewLight ? 'Add Ambient Light' : 'Edit Ambient Light'}</h2>
        <button class="close-button" on:click={handleCancel} aria-label="Close">
          &times;
        </button>
      </header>

      <div class="modal-body">
        <form on:submit|preventDefault={handleSave}>
          <!-- Position -->
          <section class="form-section">
            <h3>Position</h3>

            <div class="form-row-split">
              <label for="light-x">
                X Position
                <input
                  id="light-x"
                  type="number"
                  bind:value={formData.x}
                  step="1"
                  required
                />
              </label>

              <label for="light-y">
                Y Position
                <input
                  id="light-y"
                  type="number"
                  bind:value={formData.y}
                  step="1"
                  required
                />
              </label>
            </div>

            <div class="form-row">
              <label for="light-rotation">
                Rotation (0-360)
                <input
                  id="light-rotation"
                  type="number"
                  bind:value={formData.rotation}
                  min="0"
                  max="360"
                  step="15"
                />
              </label>
            </div>
          </section>

          <!-- Light Properties -->
          <section class="form-section">
            <h3>Light Properties</h3>

            <div class="form-row-split">
              <label for="light-bright">
                Bright Radius
                <input
                  id="light-bright"
                  type="number"
                  bind:value={formData.bright}
                  min="0"
                  step="5"
                  required
                />
              </label>

              <label for="light-dim">
                Dim Radius
                <input
                  id="light-dim"
                  type="number"
                  bind:value={formData.dim}
                  min="0"
                  step="5"
                  required
                />
              </label>
            </div>

            <div class="form-row-split">
              <label for="light-angle">
                Angle (0-360)
                <input
                  id="light-angle"
                  type="number"
                  bind:value={formData.angle}
                  min="0"
                  max="360"
                  step="15"
                />
                <span class="help-text">360 = omnidirectional, less = cone</span>
              </label>

              <label for="light-alpha">
                Opacity (0-1)
                <input
                  id="light-alpha"
                  type="number"
                  bind:value={formData.alpha}
                  min="0"
                  max="1"
                  step="0.05"
                />
              </label>
            </div>

            <div class="form-row">
              <label for="light-color">
                Light Color
                <div class="color-input-wrapper">
                  <input
                    id="light-color"
                    type="color"
                    bind:value={formData.color}
                  />
                  <input
                    type="text"
                    bind:value={formData.color}
                    pattern="#[0-9a-fA-F]{6}"
                    placeholder="#ffffff"
                  />
                </div>
              </label>
            </div>

            <!-- Light Preview -->
            <div class="light-preview">
              <div class="preview-label">Preview:</div>
              <div
                class="preview-circle"
                style="background: {previewGradient};"
              ></div>
            </div>
          </section>

          <!-- Light Type -->
          <section class="form-section">
            <h3>Light Type</h3>

            <div class="form-row-checkbox">
              <label>
                <input type="checkbox" bind:checked={formData.negative} />
                Darkness Source
              </label>
            </div>
          </section>

          <!-- Animation -->
          <section class="form-section">
            <h3>Animation (Optional)</h3>

            <div class="form-row">
              <label for="light-animation">
                Animation Type
                <select id="light-animation" bind:value={formData.animationType}>
                  {#each animationTypes as anim}
                    <option value={anim.value}>{anim.label}</option>
                  {/each}
                </select>
              </label>
            </div>

            {#if formData.animationType}
              <div class="form-row-split">
                <label for="light-anim-speed">
                  Speed (1-10)
                  <input
                    id="light-anim-speed"
                    type="number"
                    bind:value={formData.animationSpeed}
                    min="1"
                    max="10"
                    step="1"
                  />
                </label>

                <label for="light-anim-intensity">
                  Intensity (1-10)
                  <input
                    id="light-anim-intensity"
                    type="number"
                    bind:value={formData.animationIntensity}
                    min="1"
                    max="10"
                    step="1"
                  />
                </label>
              </div>

              <div class="form-row-checkbox">
                <label>
                  <input type="checkbox" bind:checked={formData.animationReverse} />
                  Reverse animation
                </label>
              </div>
            {/if}

            {#if formData.animationType === 'sparkle'}
              <div class="form-row">
                <label for="sparkleCount">
                  Spark Count: {sparkleCount}
                  <input
                    type="range"
                    id="sparkleCount"
                    min="1"
                    max="50"
                    bind:value={sparkleCount}
                  />
                </label>
              </div>

              <div class="form-row">
                <label for="sparkleSize">
                  Spark Size: {sparkleSize}px
                  <input
                    type="range"
                    id="sparkleSize"
                    min="1"
                    max="10"
                    bind:value={sparkleSize}
                  />
                </label>
              </div>

              <div class="form-row">
                <label for="sparkleLifetime">
                  Lifetime: {sparkleLifetime}ms
                  <input
                    type="range"
                    id="sparkleLifetime"
                    min="200"
                    max="5000"
                    step="100"
                    bind:value={sparkleLifetime}
                  />
                </label>
              </div>

              <div class="form-row">
                <label for="sparkleDistribution">
                  Distribution
                  <select
                    id="sparkleDistribution"
                    value={formData.data?.sparkleDistribution ?? 'uniform'}
                    on:change={(e) => {
                      formData.data = { ...formData.data, sparkleDistribution: e.currentTarget.value };
                    }}
                  >
                    <option value="uniform">Uniform</option>
                    <option value="center-weighted">Center Weighted</option>
                    <option value="edge-weighted">Edge Weighted</option>
                  </select>
                </label>
              </div>

              <div class="form-row-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.data?.sparkleFade !== false}
                    on:change={(e) => {
                      formData.data = { ...formData.data, sparkleFade: e.currentTarget.checked };
                    }}
                  />
                  Fade In/Out
                </label>
              </div>
            {/if}
          </section>

          <!-- Advanced Effects -->
          <section class="form-section">
            <h3>Advanced Effects</h3>

            <div class="form-row">
              <label for="light-attenuation">
                Falloff: {formData.attenuation.toFixed(1)}
                <input
                  id="light-attenuation"
                  type="range"
                  bind:value={formData.attenuation}
                  min="0"
                  max="1"
                  step="0.1"
                />
              </label>
            </div>

            <div class="form-row-split">
              <label for="light-luminosity">
                Luminosity
                <input
                  id="light-luminosity"
                  type="range"
                  bind:value={formData.luminosity}
                  min="0"
                  max="1"
                  step="0.1"
                />
              </label>

              <label for="light-saturation">
                Saturation
                <input
                  id="light-saturation"
                  type="range"
                  bind:value={formData.saturation}
                  min="-1"
                  max="1"
                  step="0.1"
                />
              </label>
            </div>

            <div class="form-row-split">
              <label for="light-contrast">
                Contrast
                <input
                  id="light-contrast"
                  type="range"
                  bind:value={formData.contrast}
                  min="-1"
                  max="1"
                  step="0.1"
                />
              </label>

              <label for="light-shadows">
                Shadows
                <input
                  id="light-shadows"
                  type="range"
                  bind:value={formData.shadows}
                  min="0"
                  max="1"
                  step="0.1"
                />
              </label>
            </div>

            <div class="form-row">
              <label for="light-coloration">
                Coloration Mode
                <select id="light-coloration" bind:value={formData.coloration}>
                  {#each colorationModes as mode}
                    <option value={mode.value}>{mode.label}</option>
                  {/each}
                </select>
              </label>
            </div>
          </section>

          <!-- Darkness Activation -->
          <section class="form-section">
            <h3>Darkness Activation</h3>
            <span class="help-text">Light only active when scene darkness is in this range</span>

            <div class="form-row-split">
              <label for="light-darkness-min">
                Min: {formData.darknessMin.toFixed(2)}
                <input
                  id="light-darkness-min"
                  type="range"
                  bind:value={formData.darknessMin}
                  min="0"
                  max="1"
                  step="0.05"
                />
              </label>

              <label for="light-darkness-max">
                Max: {formData.darknessMax.toFixed(2)}
                <input
                  id="light-darkness-max"
                  type="range"
                  bind:value={formData.darknessMax}
                  min="0"
                  max="1"
                  step="0.05"
                />
              </label>
            </div>
          </section>

          <!-- Settings -->
          <section class="form-section">
            <h3>Settings</h3>

            <div class="form-row-checkbox">
              <label>
                <input type="checkbox" bind:checked={formData.walls} />
                Walls block light
              </label>
            </div>

            <div class="form-row-checkbox">
              <label>
                <input type="checkbox" bind:checked={formData.vision} />
                Provides vision (players can see by this light)
              </label>
            </div>

            <div class="form-row-checkbox">
              <label>
                <input type="checkbox" bind:checked={formData.snapToGrid} />
                Snap to grid (center of cell)
              </label>
            </div>

            <div class="form-row-checkbox">
              <label>
                <input type="checkbox" bind:checked={formData.hidden} />
                Hidden (GM only)
              </label>
            </div>

            <div class="form-row-split">
              <label for="light-elevation">
                Elevation
                <input
                  id="light-elevation"
                  type="number"
                  bind:value={formData.elevation}
                  step="1"
                />
              </label>

              <label for="light-priority">
                Priority
                <input
                  id="light-priority"
                  type="number"
                  bind:value={formData.priority}
                  min="0"
                  max="100"
                  step="1"
                />
              </label>
            </div>
          </section>

          <!-- Path Following -->
          <section class="form-section">
            <h3>Path Following</h3>
            <span class="help-text">Make this light follow a path on the scene</span>

            <div class="form-row">
              <label for="light-follow-path">
                Follow Path
                <select id="light-follow-path" bind:value={formData.followPathName}>
                  <option value={null}>None</option>
                  {#each availablePaths as path}
                    <option value={path.pathName}>{path.pathName}</option>
                  {/each}
                </select>
              </label>
            </div>

            {#if formData.followPathName}
              <div class="form-row">
                <label for="light-path-speed">
                  Speed (pixels per second): {formData.pathSpeed}
                  <input
                    id="light-path-speed"
                    type="range"
                    bind:value={formData.pathSpeed}
                    min="10"
                    max="500"
                    step="10"
                  />
                </label>
              </div>
              <div class="form-row">
                <label for="light-path-speed-number">
                  <input
                    id="light-path-speed-number"
                    type="number"
                    bind:value={formData.pathSpeed}
                    min="1"
                    max="1000"
                    step="1"
                  />
                </label>
              </div>
            {/if}
          </section>
        </form>
      </div>

      <footer class="modal-footer">
        <div class="footer-left">
          {#if !isNewLight}
            <button class="button-danger" on:click={handleDelete}>
              Delete Light
            </button>
          {/if}
        </div>
        <div class="footer-right">
          <button class="button-secondary" on:click={handleCancel}>
            Cancel
          </button>
          <button class="button-primary" on:click={handleSave}>
            {isNewLight ? 'Create Light' : 'Save Changes'}
          </button>
        </div>
      </footer>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
  }

  .modal-content {
    background-color: var(--color-bg-secondary, #1e1e1e);
    border-radius: 8px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
  }

  .close-button {
    background: none;
    border: none;
    font-size: 2rem;
    line-height: 1;
    color: var(--color-text-secondary, #aaa);
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s, color 0.2s;
  }

  .close-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--color-text-primary, #ffffff);
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .form-section {
    margin-bottom: 1.5rem;
  }

  .form-section:last-child {
    margin-bottom: 0;
  }

  .form-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
    border-bottom: 1px solid var(--color-border, #333);
    padding-bottom: 0.5rem;
  }

  .form-row {
    margin-bottom: 1rem;
  }

  .form-row-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .form-row-checkbox {
    margin-bottom: 0.75rem;
  }

  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary, #aaa);
    margin-bottom: 0.25rem;
  }

  .form-row-checkbox label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .help-text {
    display: block;
    font-size: 0.75rem;
    color: var(--color-text-secondary, #888);
    margin-top: 0.25rem;
    font-weight: normal;
  }

  input[type="text"],
  input[type="number"],
  input[type="color"],
  select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border, #333);
    border-radius: 4px;
    background-color: var(--color-bg-primary, #121212);
    color: var(--color-text-primary, #ffffff);
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  input[type="text"]:focus,
  input[type="number"]:focus,
  input[type="color"]:focus,
  select:focus {
    outline: none;
    border-color: #4a90e2;
  }

  input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
  }

  input[type="range"] {
    width: 100%;
    height: 0.5rem;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
    background: var(--color-border, #333);
    border-radius: 4px;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: #4a90e2;
    cursor: pointer;
  }

  input[type="range"]::-moz-range-thumb {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: #4a90e2;
    cursor: pointer;
    border: none;
  }

  .color-input-wrapper {
    display: grid;
    grid-template-columns: 4rem 1fr;
    gap: 0.5rem;
  }

  .color-input-wrapper input[type="color"] {
    height: 2.5rem;
    cursor: pointer;
    padding: 0.25rem;
  }

  .light-preview {
    margin-top: 1.5rem;
    padding: 1rem;
    background-color: var(--color-bg-primary, #121212);
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .preview-label {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #aaa);
    font-weight: 500;
  }

  .preview-circle {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 1px solid var(--color-border, #333);
    background: #000;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border, #333);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .footer-left,
  .footer-right {
    display: flex;
    gap: 0.75rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
  }

  button:active {
    transform: scale(0.98);
  }

  .button-primary {
    background-color: #4a90e2;
    color: white;
  }

  .button-primary:hover {
    background-color: #357abd;
  }

  .button-secondary {
    background-color: transparent;
    color: var(--color-text-secondary, #aaa);
    border: 1px solid var(--color-border, #333);
  }

  .button-secondary:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--color-text-primary, #ffffff);
  }

  .button-danger {
    background-color: #ef4444;
    color: white;
  }

  .button-danger:hover {
    background-color: #dc2626;
  }

  @media (max-width: 640px) {
    .modal-backdrop {
      padding: 0;
    }

    .modal-content {
      max-height: 100vh;
      border-radius: 0;
    }

    .form-row-split {
      grid-template-columns: 1fr;
    }
  }
</style>
