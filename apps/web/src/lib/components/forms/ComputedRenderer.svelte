<script lang="ts">
  import type { ComputedNode, FormComputedField } from '@vtt/shared';
  import { computedFieldEngine } from '$lib/services/computedFieldEngine';

  interface Props {
    node: ComputedNode;
    entity: Record<string, unknown>;
    computedFields: FormComputedField[];
  }

  let { node, entity, computedFields }: Props = $props();

  // Find the computed field definition - stable reference
  const field = $derived(computedFields?.find(f => f.id === node.fieldId));

  // Compute the value as a derived - no $effect needed
  // This avoids the infinite loop caused by state updates in effects
  const computeResult = $derived.by(() => {
    if (!field) {
      return { value: undefined, error: `Computed field not found: ${node.fieldId}` };
    }

    try {
      const value = computedFieldEngine.evaluate(field, entity);
      return { value, error: undefined };
    } catch (err) {
      return { value: undefined, error: (err as Error).message };
    }
  });

  // Extract values for template use
  const computedValue = $derived(computeResult.value);
  const error = $derived(computeResult.error);

  // Format the display value
  const displayValue = $derived.by(() => {
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

<div class="computed-field" class:has-error={error}>
  {#if node.label}
    <label class="computed-label">
      {node.label}
    </label>
  {/if}

  <div class="computed-value">
    {#if error}
      <span class="error-message" title={error}>
        Error: {error}
      </span>
    {:else if displayValue}
      <span class="value">{displayValue}</span>
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

  .error-message {
    color: var(--error-color, #c53030);
    font-size: 0.875rem;
  }
</style>
