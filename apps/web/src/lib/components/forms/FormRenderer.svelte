<script lang="ts">
  import type { FormDefinition, LayoutNode } from '@vtt/shared';
  import LayoutRenderer from './LayoutRenderer.svelte';

  // Props using Svelte 5 syntax
  interface Props {
    form: FormDefinition;
    entity: Record<string, unknown>;
    mode?: 'view' | 'edit';
    onChange?: (path: string, value: unknown) => void;
    onSave?: () => void;
  }

  let {
    form,
    entity,
    mode = 'view',
    onChange,
    onSave
  }: Props = $props();

  // Track changes for dirty state
  let isDirty = $state(false);

  function handleFieldChange(path: string, value: unknown) {
    isDirty = true;
    onChange?.(path, value);
  }

  function handleSave() {
    onSave?.();
    isDirty = false;
  }
</script>

<div class="form-renderer" class:view-mode={mode === 'view'} class:edit-mode={mode === 'edit'}>
  <div class="form-content">
    {#each form.layout as node}
      <LayoutRenderer
        {node}
        {entity}
        {mode}
        fragments={form.fragments}
        computedFields={form.computedFields}
        onChange={handleFieldChange}
      />
    {/each}
  </div>

  {#if mode === 'edit'}
    <div class="form-actions">
      <button
        type="button"
        class="save-btn"
        disabled={!isDirty}
        onclick={handleSave}
      >
        Save
      </button>
    </div>
  {/if}
</div>

<style>
  .form-renderer {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .form-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .form-actions {
    padding: 0.5rem 1rem;
    border-top: 1px solid var(--border-color, #ccc);
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .save-btn {
    padding: 0.5rem 1rem;
    background: var(--primary-color, #007bff);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
