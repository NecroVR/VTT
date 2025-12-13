<script lang="ts">
  import type { FormDefinition, LayoutNode } from '@vtt/shared';
  import LayoutRenderer from './LayoutRenderer.svelte';
  import { getTheme, themeToCssVariables } from '$lib/services/formThemes';
  import { sanitizeAndScopeCustomCss, generateFormScopeClass, validateCustomProperties } from '$lib/services/cssSanitizer';

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

  // Loading state for save operations
  let isSaving = $state(false);

  // Generate scope class for this form
  const scopeClass = generateFormScopeClass(form.id);

  // Compute theme variables
  const themeVariables = $derived(() => {
    const themeName = form.styles?.theme || 'default';
    const theme = getTheme(themeName);
    if (!theme) return {};
    return themeToCssVariables(theme);
  });

  // Compute custom CSS variables
  const customVariables = $derived(() => {
    if (!form.styles?.variables) return {};
    return validateCustomProperties(form.styles.variables);
  });

  // Compute all CSS variables
  const allVariables = $derived(() => {
    return { ...themeVariables(), ...customVariables() };
  });

  // Compute scoped custom CSS
  const scopedCustomCss = $derived(() => {
    if (!form.styles?.customCSS) return '';
    return sanitizeAndScopeCustomCss(form.styles.customCSS, form.id);
  });

  // Convert variables to CSS style string
  const cssVariablesStyle = $derived(() => {
    return Object.entries(allVariables())
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
  });

  function handleFieldChange(path: string, value: unknown) {
    isDirty = true;
    onChange?.(path, value);
  }

  async function handleSave() {
    if (isSaving) return;

    isSaving = true;
    try {
      await onSave?.();
      isDirty = false;
    } finally {
      isSaving = false;
    }
  }
</script>

<svelte:head>
  {#if scopedCustomCss()}
    <style>
      {@html scopedCustomCss()}
    </style>
  {/if}
</svelte:head>

<div
  class="form-renderer {scopeClass}"
  class:view-mode={mode === 'view'}
  class:edit-mode={mode === 'edit'}
  style={cssVariablesStyle()}
  role="form"
  aria-label={form.name}
>
  <div class="form-content" role="main" aria-label="Form fields">
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
    <div class="form-actions" role="group" aria-label="Form actions">
      <button
        type="button"
        class="save-btn"
        class:loading={isSaving}
        disabled={!isDirty || isSaving}
        onclick={handleSave}
        aria-label={isSaving ? 'Saving changes...' : isDirty ? 'Save changes' : 'No changes to save'}
        aria-live="polite"
        aria-busy={isSaving}
      >
        {#if isSaving}
          <span class="spinner" aria-hidden="true"></span>
          Saving...
        {:else}
          Save
        {/if}
      </button>
    </div>
  {/if}
</div>

<style>
  .form-renderer {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--form-bg-color, #ffffff);
    color: var(--form-text-color, #212529);
    font-family: var(--form-font-body, system-ui, sans-serif);
  }

  .form-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--form-spacing-md, 1rem);
  }

  .form-actions {
    padding: var(--form-spacing-sm, 0.5rem) var(--form-spacing-md, 1rem);
    border-top: 1px solid var(--form-border-color, #ccc);
    display: flex;
    justify-content: flex-end;
    gap: var(--form-spacing-sm, 0.5rem);
    background: var(--form-surface-color, #f8f9fa);
  }

  .save-btn {
    padding: var(--form-spacing-sm, 0.5rem) var(--form-spacing-md, 1rem);
    background: var(--form-primary-color, #007bff);
    color: white;
    border: none;
    border-radius: var(--form-radius-md, 4px);
    cursor: pointer;
    font-weight: 500;
    transition: opacity 0.2s;
  }

  .save-btn:hover:not(:disabled) {
    opacity: 0.9;
  }

  .save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .save-btn.loading {
    position: relative;
    padding-left: 2.5rem;
  }

  .spinner {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: translateY(-50%) rotate(360deg); }
  }

  /* Focus styles for accessibility */
  .save-btn:focus-visible {
    outline: 2px solid var(--form-primary-color, #007bff);
    outline-offset: 2px;
  }
</style>
