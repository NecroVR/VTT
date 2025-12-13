<script lang="ts">
  import type {
    VisibilityCondition,
    SimpleCondition,
    CompoundCondition,
    ConditionOperator
  } from '@vtt/shared';

  interface Props {
    condition: VisibilityCondition;
    onUpdate: (condition: VisibilityCondition) => void;
  }

  let { condition, onUpdate }: Props = $props();

  // Available operators
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

  // Operator labels for display
  const operatorLabels: Record<ConditionOperator, string> = {
    equals: 'equals',
    notEquals: 'does not equal',
    contains: 'contains',
    isEmpty: 'is empty',
    isNotEmpty: 'is not empty',
    greaterThan: 'is greater than',
    lessThan: 'is less than',
    greaterThanOrEqual: 'is greater than or equal to',
    lessThanOrEqual: 'is less than or equal to'
  };

  // Operators that don't need a value
  const noValueOperators: ConditionOperator[] = ['isEmpty', 'isNotEmpty'];

  // Local state for condition mode
  let conditionMode = $state<'simple' | 'compound'>(condition.type);

  // Update mode when condition prop changes
  $effect(() => {
    conditionMode = condition.type;
  });

  // Toggle between simple and compound mode
  function toggleMode() {
    if (conditionMode === 'simple') {
      // Switch to compound mode - create a compound condition with one simple condition
      const simpleCondition = condition as SimpleCondition;
      const compoundCondition: CompoundCondition = {
        type: 'compound',
        operator: 'and',
        conditions: [simpleCondition]
      };
      conditionMode = 'compound';
      onUpdate(compoundCondition);
    } else {
      // Switch to simple mode - use first condition if available
      const compoundCondition = condition as CompoundCondition;
      if (compoundCondition.conditions.length > 0 && compoundCondition.conditions[0].type === 'simple') {
        conditionMode = 'simple';
        onUpdate(compoundCondition.conditions[0] as SimpleCondition);
      } else {
        // Create a default simple condition
        const defaultCondition: SimpleCondition = {
          type: 'simple',
          field: '',
          operator: 'equals',
          value: ''
        };
        conditionMode = 'simple';
        onUpdate(defaultCondition);
      }
    }
  }

  // Update simple condition
  function updateSimpleCondition(field: string, operator: ConditionOperator, value?: unknown) {
    const newCondition: SimpleCondition = {
      type: 'simple',
      field,
      operator,
      value: noValueOperators.includes(operator) ? undefined : value
    };
    onUpdate(newCondition);
  }

  // Update compound condition operator
  function updateCompoundOperator(operator: 'and' | 'or') {
    const compoundCondition = condition as CompoundCondition;
    onUpdate({
      ...compoundCondition,
      operator
    });
  }

  // Add a new condition to compound
  function addCondition() {
    const compoundCondition = condition as CompoundCondition;
    const newCondition: SimpleCondition = {
      type: 'simple',
      field: '',
      operator: 'equals',
      value: ''
    };
    onUpdate({
      ...compoundCondition,
      conditions: [...compoundCondition.conditions, newCondition]
    });
  }

  // Remove a condition from compound
  function removeCondition(index: number) {
    const compoundCondition = condition as CompoundCondition;
    const newConditions = compoundCondition.conditions.filter((_, i) => i !== index);

    // If only one condition left, switch to simple mode
    if (newConditions.length === 1 && newConditions[0].type === 'simple') {
      onUpdate(newConditions[0] as SimpleCondition);
      conditionMode = 'simple';
    } else {
      onUpdate({
        ...compoundCondition,
        conditions: newConditions
      });
    }
  }

  // Update a specific condition in compound
  function updateConditionInCompound(index: number, field: string, operator: ConditionOperator, value?: unknown) {
    const compoundCondition = condition as CompoundCondition;
    const updatedCondition: SimpleCondition = {
      type: 'simple',
      field,
      operator,
      value: noValueOperators.includes(operator) ? undefined : value
    };

    const newConditions = [...compoundCondition.conditions];
    newConditions[index] = updatedCondition;

    onUpdate({
      ...compoundCondition,
      conditions: newConditions
    });
  }

  // Generate plain English preview
  function generatePreview(cond: VisibilityCondition): string {
    if (cond.type === 'simple') {
      const simple = cond as SimpleCondition;
      const field = simple.field || '(field)';
      const op = operatorLabels[simple.operator];
      const value = simple.value !== undefined && simple.value !== '' ? ` ${simple.value}` : '';
      return `Show when ${field} ${op}${value}`;
    } else {
      const compound = cond as CompoundCondition;
      if (compound.conditions.length === 0) {
        return 'No conditions defined';
      }

      const conditionPreviews = compound.conditions.map(c => {
        if (c.type === 'simple') {
          const simple = c as SimpleCondition;
          const field = simple.field || '(field)';
          const op = operatorLabels[simple.operator];
          const value = simple.value !== undefined && simple.value !== '' ? ` ${simple.value}` : '';
          return `${field} ${op}${value}`;
        }
        return '(nested condition)';
      });

      const joiner = compound.operator === 'and' ? ' AND ' : ' OR ';
      return `Show when ${conditionPreviews.join(joiner)}`;
    }
  }
</script>

<div class="condition-builder">
  <!-- Mode Toggle -->
  <div class="mode-toggle">
    <button
      type="button"
      class="btn-mode"
      class:active={conditionMode === 'simple'}
      onclick={() => conditionMode === 'compound' && toggleMode()}
    >
      Simple
    </button>
    <button
      type="button"
      class="btn-mode"
      class:active={conditionMode === 'compound'}
      onclick={() => conditionMode === 'simple' && toggleMode()}
    >
      Compound
    </button>
  </div>

  <!-- Simple Mode -->
  {#if conditionMode === 'simple' && condition.type === 'simple'}
    {@const simple = condition as SimpleCondition}
    <div class="simple-condition">
      <label>
        <span>Field</span>
        <input
          type="text"
          value={simple.field}
          oninput={(e) => updateSimpleCondition(
            (e.target as HTMLInputElement).value,
            simple.operator,
            simple.value
          )}
          placeholder="attributes.strength.value"
        />
      </label>

      <label>
        <span>Operator</span>
        <select
          value={simple.operator}
          onchange={(e) => updateSimpleCondition(
            simple.field,
            (e.target as HTMLSelectElement).value as ConditionOperator,
            simple.value
          )}
        >
          {#each operators as op}
            <option value={op}>{operatorLabels[op]}</option>
          {/each}
        </select>
      </label>

      {#if !noValueOperators.includes(simple.operator)}
        <label>
          <span>Value</span>
          <input
            type="text"
            value={simple.value?.toString() || ''}
            oninput={(e) => updateSimpleCondition(
              simple.field,
              simple.operator,
              (e.target as HTMLInputElement).value
            )}
            placeholder="comparison value"
          />
        </label>
      {/if}
    </div>
  {/if}

  <!-- Compound Mode -->
  {#if conditionMode === 'compound' && condition.type === 'compound'}
    {@const compound = condition as CompoundCondition}
    <div class="compound-condition">
      <!-- Compound Operator -->
      <div class="compound-operator">
        <label>
          <span>Combine conditions with:</span>
          <select
            value={compound.operator}
            onchange={(e) => updateCompoundOperator((e.target as HTMLSelectElement).value as 'and' | 'or')}
          >
            <option value="and">AND (all must be true)</option>
            <option value="or">OR (any can be true)</option>
          </select>
        </label>
      </div>

      <!-- Conditions List -->
      <div class="conditions-list">
        {#each compound.conditions as cond, index}
          {#if cond.type === 'simple'}
            {@const simple = cond as SimpleCondition}
            <div class="condition-item">
              <div class="condition-number">{index + 1}</div>
              <div class="condition-fields">
                <label>
                  <span>Field</span>
                  <input
                    type="text"
                    value={simple.field}
                    oninput={(e) => updateConditionInCompound(
                      index,
                      (e.target as HTMLInputElement).value,
                      simple.operator,
                      simple.value
                    )}
                    placeholder="field.path"
                  />
                </label>

                <label>
                  <span>Operator</span>
                  <select
                    value={simple.operator}
                    onchange={(e) => updateConditionInCompound(
                      index,
                      simple.field,
                      (e.target as HTMLSelectElement).value as ConditionOperator,
                      simple.value
                    )}
                  >
                    {#each operators as op}
                      <option value={op}>{operatorLabels[op]}</option>
                    {/each}
                  </select>
                </label>

                {#if !noValueOperators.includes(simple.operator)}
                  <label>
                    <span>Value</span>
                    <input
                      type="text"
                      value={simple.value?.toString() || ''}
                      oninput={(e) => updateConditionInCompound(
                        index,
                        simple.field,
                        simple.operator,
                        (e.target as HTMLInputElement).value
                      )}
                      placeholder="value"
                    />
                  </label>
                {/if}
              </div>
              <button
                type="button"
                class="btn-remove"
                onclick={() => removeCondition(index)}
                title="Remove condition"
              >
                ✕
              </button>
            </div>
          {/if}
        {/each}
      </div>

      <!-- Add Condition Button -->
      <button type="button" class="btn-add" onclick={addCondition}>
        + Add Condition
      </button>
    </div>
  {/if}

  <!-- Preview -->
  <div class="preview">
    <div class="preview-label">Preview:</div>
    <div class="preview-text">{generatePreview(condition)}</div>
  </div>
</div>

<style>
  .condition-builder {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .mode-toggle {
    display: flex;
    gap: 0.5rem;
    border-bottom: 1px solid var(--border-color, #ddd);
    padding-bottom: 0.5rem;
  }

  .btn-mode {
    padding: 0.5rem 1rem;
    border: 1px solid var(--input-border, #ced4da);
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-size: 0.875rem;
    font-family: inherit;
    transition: all 0.2s;
  }

  .btn-mode:hover {
    background: var(--hover-bg, #f0f0f0);
  }

  .btn-mode.active {
    background: var(--primary-color, #007bff);
    color: white;
    border-color: var(--primary-color, #007bff);
  }

  .simple-condition {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .compound-condition {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .compound-operator {
    padding: 0.75rem;
    background: var(--group-header-bg, #f8f9fa);
    border-radius: 4px;
  }

  .conditions-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .condition-item {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    background: white;
  }

  .condition-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: var(--primary-color, #007bff);
    color: white;
    font-size: 0.875rem;
    font-weight: 600;
    flex-shrink: 0;
  }

  .condition-fields {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
  }

  .btn-remove {
    padding: 0.5rem;
    border: 1px solid var(--danger-color, #dc3545);
    border-radius: 4px;
    background: white;
    color: var(--danger-color, #dc3545);
    cursor: pointer;
    font-size: 1rem;
    height: fit-content;
    flex-shrink: 0;
  }

  .btn-remove:hover {
    background: var(--danger-color, #dc3545);
    color: white;
  }

  .btn-add {
    padding: 0.5rem 1rem;
    border: 1px dashed var(--input-border, #ced4da);
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-size: 0.875rem;
    font-family: inherit;
    color: var(--primary-color, #007bff);
  }

  .btn-add:hover {
    background: var(--hover-bg, #f0f0f0);
    border-style: solid;
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

  .preview {
    padding: 0.75rem;
    background: var(--info-bg, #e7f3ff);
    border-left: 3px solid var(--info-border, #0066cc);
    border-radius: 4px;
  }

  .preview-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted, #6c757d);
    margin-bottom: 0.25rem;
  }

  .preview-text {
    font-size: 0.875rem;
    color: var(--text-color, #212529);
    font-style: italic;
  }
</style>
