<script lang="ts">
  import type { ConditionalNode, SimpleCondition, ConditionOperator } from '@vtt/shared';

  interface Props {
    node: ConditionalNode;
    onUpdate: (updates: Partial<ConditionalNode>) => void;
  }

  let { node, onUpdate }: Props = $props();

  const operators: ConditionOperator[] = [
    'equals',
    'notEquals',
    'contains',
    'isEmpty',
    'isNotEmpty',
    'greaterThan',
    'lessThan',
    'greaterThanOrEqual',
    'lessThanOrEqual'
  ];

  // For simple condition editing (complex builder comes later)
  const simpleCondition = $derived(
    node.condition.type === 'simple' ? node.condition : null
  );

  function updateSimpleCondition(field: string, operator: ConditionOperator, value?: unknown) {
    const newCondition: SimpleCondition = {
      type: 'simple',
      field,
      operator,
      value
    };
    onUpdate({ condition: newCondition });
  }
</script>

<div class="conditional-properties">
  <div class="property-group">
    <div class="group-header">
      <h4>Condition</h4>
    </div>
    <div class="group-content">
      {#if node.condition.type === 'compound'}
        <div class="info-box">
          <p>This node has a compound condition (multiple conditions combined with AND/OR).</p>
          <p class="note">Full condition builder coming in future phase.</p>
        </div>
      {:else if simpleCondition}
        <label>
          <span>Field</span>
          <input
            type="text"
            value={simpleCondition.field}
            oninput={(e) => updateSimpleCondition(
              (e.target as HTMLInputElement).value,
              simpleCondition.operator,
              simpleCondition.value
            )}
            placeholder="attributes.strength.value"
          />
        </label>

        <label>
          <span>Operator</span>
          <select
            value={simpleCondition.operator}
            onchange={(e) => updateSimpleCondition(
              simpleCondition.field,
              (e.target as HTMLSelectElement).value as ConditionOperator,
              simpleCondition.value
            )}
          >
            {#each operators as op}
              <option value={op}>{op}</option>
            {/each}
          </select>
        </label>

        {#if simpleCondition.operator !== 'isEmpty' && simpleCondition.operator !== 'isNotEmpty'}
          <label>
            <span>Value</span>
            <input
              type="text"
              value={simpleCondition.value?.toString() || ''}
              oninput={(e) => updateSimpleCondition(
                simpleCondition.field,
                simpleCondition.operator,
                (e.target as HTMLInputElement).value
              )}
              placeholder="comparison value"
            />
          </label>
        {/if}
      {/if}

      <div class="info-box">
        <p class="note">Full condition builder with compound logic (AND/OR) will be added in Phase 3.6</p>
      </div>
    </div>
  </div>
</div>

<style>
  .property-group {
    border-bottom: 1px solid var(--border-color, #ddd);
  }

  .group-header {
    padding: 0.75rem 1rem;
    background: var(--group-header-bg, #f8f9fa);
  }

  .group-header h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color, #212529);
  }

  .group-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
  }

  label > span {
    font-weight: 500;
    color: var(--label-color, #495057);
  }

  input[type="text"],
  select {
    padding: 0.5rem;
    border: 1px solid var(--input-border, #ced4da);
    border-radius: 4px;
    font-size: 0.875rem;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: var(--primary-color, #007bff);
  }

  .info-box {
    padding: 0.75rem;
    background: var(--info-bg, #e7f3ff);
    border-left: 3px solid var(--info-border, #0066cc);
    border-radius: 4px;
  }

  .info-box p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-color, #212529);
  }

  .note {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-muted, #6c757d);
    font-style: italic;
  }
</style>
