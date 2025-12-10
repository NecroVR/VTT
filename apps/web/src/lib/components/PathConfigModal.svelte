<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Path, PathUpdateInput, Token, AmbientLight } from '@vtt/shared';

  // Props
  export let isOpen: boolean = false;
  export let path: Path | null = null;
  export let tokens: Token[] = [];
  export let lights: AmbientLight[] = [];
  export let onSave: (updates: PathUpdateInput) => void;
  export let onClose: () => void;
  export let onDelete: () => void;

  const dispatch = createEventDispatcher<{
    close: void;
    save: PathUpdateInput;
    delete: void;
  }>();

  // Determine if this is a new path or editing existing
  const isNewPath = !path;

  // Form state
  let formData = {
    name: path?.name ?? 'Unnamed Path',
    speed: path?.speed ?? 50,
    color: path?.color ?? '#ff6b35',
    visible: path?.visible ?? true,
    loop: path?.loop ?? false,
    assignedObjectId: path?.assignedObjectId ?? null,
    assignedObjectType: path?.assignedObjectType ?? null,
  };

  // Reset form when modal opens or path changes
  $: if (isOpen && path) {
    formData = {
      name: path.name,
      speed: path.speed,
      color: path.color,
      visible: path.visible,
      loop: path.loop,
      assignedObjectId: path.assignedObjectId ?? null,
      assignedObjectType: path.assignedObjectType ?? null,
    };
  }

  function handleSave() {
    const updates: PathUpdateInput = {
      name: formData.name,
      speed: formData.speed,
      color: formData.color,
      visible: formData.visible,
      loop: formData.loop,
      assignedObjectId: formData.assignedObjectId,
      assignedObjectType: formData.assignedObjectType,
    };

    onSave(updates);
    dispatch('save', updates);
    handleCancel();
  }

  function handleCancel() {
    onClose();
    dispatch('close');
  }

  function handleDelete() {
    if (!path) return;

    if (confirm(`Are you sure you want to delete path "${path.name}"?`)) {
      onDelete();
      dispatch('delete');
      handleCancel();
    }
  }

  function handleAssignedObjectChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = target.value;

    if (value === 'none') {
      formData.assignedObjectId = null;
      formData.assignedObjectType = null;
    } else if (value.startsWith('token-')) {
      formData.assignedObjectId = value.substring(6);
      formData.assignedObjectType = 'token';
    } else if (value.startsWith('light-')) {
      formData.assignedObjectId = value.substring(6);
      formData.assignedObjectType = 'light';
    }
  }

  function getAssignedObjectValue(): string {
    if (!formData.assignedObjectId) return 'none';
    if (formData.assignedObjectType === 'token') return `token-${formData.assignedObjectId}`;
    if (formData.assignedObjectType === 'light') return `light-${formData.assignedObjectId}`;
    return 'none';
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
        <h2>{isNewPath ? 'Create Path' : 'Configure Path'}</h2>
        <button class="close-button" on:click={handleCancel} aria-label="Close">
          &times;
        </button>
      </header>

      <div class="modal-body">
        <form on:submit|preventDefault={handleSave}>
          <!-- Path Name -->
          <section class="form-section">
            <div class="form-row">
              <label for="path-name">
                Path Name
                <input
                  id="path-name"
                  type="text"
                  bind:value={formData.name}
                  required
                  placeholder="Enter path name"
                />
              </label>
            </div>
          </section>

          <!-- Path Properties -->
          <section class="form-section">
            <h3>Path Properties</h3>

            <div class="form-row">
              <label for="path-speed">
                Movement Speed (units/second)
                <input
                  id="path-speed"
                  type="number"
                  bind:value={formData.speed}
                  min="1"
                  max="500"
                  step="5"
                  required
                />
              </label>
              <div class="help-text">How fast objects move along this path (1-500 units per second)</div>
            </div>

            <div class="form-row">
              <label for="path-color">
                Path Color
                <div class="color-input-wrapper">
                  <input
                    id="path-color"
                    type="color"
                    bind:value={formData.color}
                  />
                  <input
                    type="text"
                    bind:value={formData.color}
                    pattern="#[0-9a-fA-F]{6}"
                    placeholder="#ff6b35"
                  />
                </div>
              </label>
              <div class="help-text">Color used to visualize the path</div>
            </div>
          </section>

          <!-- Path Behavior -->
          <section class="form-section">
            <h3>Behavior</h3>

            <div class="form-row-checkbox">
              <label>
                <input type="checkbox" bind:checked={formData.loop} />
                Loop (object returns to start after reaching end)
              </label>
            </div>

            <div class="form-row-checkbox">
              <label>
                <input type="checkbox" bind:checked={formData.visible} />
                Visible (only GM can see paths regardless)
              </label>
            </div>
          </section>

          <!-- Assigned Object -->
          <section class="form-section">
            <h3>Assigned Object</h3>

            <div class="form-row">
              <label for="path-assigned-object">
                Object to Follow Path
                <select
                  id="path-assigned-object"
                  value={getAssignedObjectValue()}
                  on:change={handleAssignedObjectChange}
                >
                  <option value="none">None</option>

                  {#if tokens.length > 0}
                    <optgroup label="Tokens">
                      {#each tokens as token}
                        <option value="token-{token.id}">{token.name}</option>
                      {/each}
                    </optgroup>
                  {/if}

                  {#if lights.length > 0}
                    <optgroup label="Lights">
                      {#each lights as light}
                        <option value="light-{light.id}">
                          Light at ({Math.round(light.x)}, {Math.round(light.y)})
                        </option>
                      {/each}
                    </optgroup>
                  {/if}
                </select>
              </label>
              <div class="help-text">Select a token or light to animate along this path</div>
            </div>

            {#if formData.assignedObjectId}
              <div class="info-text">
                Assigned: {formData.assignedObjectType === 'token' ? 'Token' : 'Light'} (ID: {formData.assignedObjectId})
              </div>
            {/if}
          </section>

          <!-- Path Statistics -->
          {#if path && path.nodes && path.nodes.length > 0}
            <section class="form-section">
              <h3>Path Statistics</h3>

              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-label">Nodes</div>
                  <div class="stat-value">{path.nodes.length}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">Created</div>
                  <div class="stat-value">{new Date(path.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </section>
          {/if}
        </form>
      </div>

      <footer class="modal-footer">
        <div class="footer-left">
          {#if !isNewPath}
            <button class="button-danger" on:click={handleDelete}>
              Delete Path
            </button>
          {/if}
        </div>
        <div class="footer-right">
          <button class="button-secondary" on:click={handleCancel}>
            Cancel
          </button>
          <button class="button-primary" on:click={handleSave}>
            {isNewPath ? 'Create Path' : 'Save Changes'}
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
    font-size: 0.75rem;
    color: var(--color-text-tertiary, #888);
    margin-top: 0.25rem;
  }

  .info-text {
    font-size: 0.875rem;
    color: var(--color-text-secondary, #aaa);
    font-style: italic;
    margin-top: 0.5rem;
    padding: 0.75rem;
    background-color: var(--color-bg-primary, #121212);
    border-radius: 4px;
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

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat-item {
    padding: 1rem;
    background-color: var(--color-bg-primary, #121212);
    border-radius: 4px;
    text-align: center;
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--color-text-secondary, #aaa);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }

  .stat-value {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary, #ffffff);
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

    .stats-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
