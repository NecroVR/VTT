<script lang="ts">
  import type { ComputedNode, FormComputedField } from '@vtt/shared';
  import { computedFieldEngine } from '$lib/services/computedFieldEngine';

  interface Props {
    node: ComputedNode;
    entity: Record<string, unknown>;
    computedFields: FormComputedField[];
  }

  let { node, entity, computedFields }: Props = $props();

  // State
  let isComputing = $state(false);
  let computedValue: unknown = $state(undefined);
  let error: string | undefined = $state(undefined);

  // Find the computed field definition
  const field = $derived(computedFields.find(f => f.id === node.fieldId));

  // Compute the value whenever entity or field changes
  $effect(() => {
    if (!field) {
      error = `Computed field not found: ${node.fieldId}`;
      computedValue = undefined;
      return;
    }

    isComputing = true;
    error = undefined;

    try {
      computedValue = computedFieldEngine.evaluate(field, entity);
    } catch (err) {
      error = (err as Error).message;
      computedValue = undefined;
    } finally {
      isComputing = false;
    }
  });

  // Format the display value
  const displayValue = $derived(() => {
    if (error) return null;
    if (computedValue === undefined || computedValue === null) return null;

    // Apply format string if provided
    if (node.format) {
      return node.format.replace('{value}', String(computedValue));
    }

    // Default formatting based on type
    if (typeof computedValue === 'number') {
      // Round to 2 decimal places for display
      return Number.isInteger(computedValue)
        ? String(computedValue)
        : computedValue.toFixed(2);
    }

    return String(computedValue);
  });
</script>

<div class="computed-field" class:has-error={error} class:computing={isComputing}>
  {#if node.label}
    <label class="computed-label">
      {node.label}
    </label>
  {/if}

  <div class="computed-value">
    {#if isComputing}
      <span class="loading-indicator">Computing...</span>
    {:else if error}
      <span class="error-message" title={error}>
        Error: {error}
      </span>
    {:else if displayValue()}
      <span class="value">{displayValue()}</span>
    {:else}
      <span class="empty-value">—</span>
    {/if}
  </div>
</div>

<style>
  .computed-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem;
    border-radius: 4px;
    background: var(--computed-bg, #f8f9fa);
    border: 1px solid var(--computed-border, #dee2e6);
  }

  .computed-field.computing {
    opacity: 0.7;
  }

  .computed-field.has-error {
    background: var(--error-bg, #fff5f5);
    border-color: var(--error-border, #feb2b2);
  }

  .computed-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--label-color, #495057);
    margin: 0;
  }

  .computed-value {
    font-size: 1rem;
    color: var(--text-color, #212529);
  }

  .value {
    font-weight: 600;
    color: var(--computed-value-color, #2c5282);
  }

  .empty-value {
    color: var(--text-muted, #6c757d);
    font-style: italic;
  }

  .loading-indicator {
    color: var(--text-muted, #6c757d);
    font-size: 0.875rem;
    font-style: italic;
  }

  .error-message {
    color: var(--error-color, #c53030);
    font-size: 0.875rem;
  }
</style>
