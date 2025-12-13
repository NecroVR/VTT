<script lang="ts">
  import type { ComputedNode, FormComputedField } from '@vtt/shared';
  import { computedFieldEngine } from '$lib/services/computedFieldEngine';

  interface Props {
    node: ComputedNode;
    computedFields: FormComputedField[];
    onUpdate: (updates: Partial<ComputedNode>) => void;
    onUpdateComputedField?: (field: FormComputedField) => void;
  }

  let { node, computedFields, onUpdate, onUpdateComputedField }: Props = $props();

  // State for formula editing
  let editingFormula = $state(false);
  let formulaInput = $state('');
  let formulaError = $state<string | undefined>(undefined);
  let testResult = $state<string | undefined>(undefined);

  // Sample test data for formula validation
  let testData = $state('{"abilities": {"strength": {"value": 16}}, "level": 5, "proficiencyBonus": 3}');
  let testDataError = $state<string | undefined>(undefined);

  // Find the selected computed field
  const selectedField = $derived(computedFields.find(f => f.id === node.fieldId));

  // Validate formula on input
  function validateFormula(formula: string): void {
    if (!formula.trim()) {
      formulaError = undefined;
      testResult = undefined;
      return;
    }

    const validation = computedFieldEngine.validateFormula(formula);
    if (!validation.valid) {
      formulaError = validation.error;
      testResult = undefined;
    } else {
      formulaError = undefined;
      // Try to evaluate with test data
      testWithData(formula);
    }
  }

  // Test formula with sample data
  function testWithData(formula: string): void {
    if (!formula.trim()) {
      testResult = undefined;
      return;
    }

    try {
      // Parse test data
      const context = JSON.parse(testData);
      testDataError = undefined;

      // Create a temporary field
      const tempField: FormComputedField = {
        id: 'temp',
        name: 'Test',
        formula,
        resultType: 'number',
        dependencies: []
      };

      // Evaluate
      const result = computedFieldEngine.evaluate(tempField, context, true);
      testResult = `Result: ${JSON.stringify(result)}`;
    } catch (error) {
      if (error instanceof SyntaxError) {
        testDataError = 'Invalid JSON in test data';
        testResult = undefined;
      } else {
        testResult = `Error: ${(error as Error).message}`;
      }
    }
  }

  // Start editing formula
  function startEditing(): void {
    if (selectedField) {
      formulaInput = selectedField.formula;
      editingFormula = true;
      validateFormula(formulaInput);
    }
  }

  // Save formula changes
  function saveFormula(): void {
    if (selectedField && onUpdateComputedField) {
      onUpdateComputedField({
        ...selectedField,
        formula: formulaInput
      });
      editingFormula = false;
    }
  }

  // Cancel editing
  function cancelEditing(): void {
    editingFormula = false;
    formulaError = undefined;
    testResult = undefined;
  }
</script>

<div class="computed-properties">
  <div class="property-group">
    <div class="group-header">
      <h4>Computed Field</h4>
    </div>
    <div class="group-content">
      <label>
        <span>Field ID</span>
        <select
          value={node.fieldId}
          onchange={(e) => onUpdate({ fieldId: (e.target as HTMLSelectElement).value })}
        >
          <option value="">Select a computed field...</option>
          {#each computedFields as field}
            <option value={field.id}>{field.name} ({field.id})</option>
          {/each}
        </select>
        <span class="help-text">Select which computed field to display</span>
      </label>

      {#if selectedField}
        <div class="field-info">
          <div class="info-row">
            <strong>Formula:</strong>
            <code class="formula-display">{selectedField.formula}</code>
          </div>
          <div class="info-row">
            <strong>Result Type:</strong>
            <span>{selectedField.resultType}</span>
          </div>
          {#if selectedField.description}
            <div class="info-row">
              <strong>Description:</strong>
              <span>{selectedField.description}</span>
            </div>
          {/if}

          {#if onUpdateComputedField}
            <button
              type="button"
              class="btn-secondary"
              onclick={startEditing}
            >
              Edit Formula
            </button>
          {/if}
        </div>
      {:else}
        <div class="info-box warning">
          <p>No computed field selected. Select one from the dropdown above.</p>
        </div>
      {/if}
    </div>
  </div>

  <div class="property-group">
    <div class="group-header">
      <h4>Display</h4>
    </div>
    <div class="group-content">
      <label>
        <span>Label</span>
        <input
          type="text"
          value={node.label || ''}
          oninput={(e) => onUpdate({ label: (e.target as HTMLInputElement).value })}
          placeholder="Field Label"
        />
      </label>

      <label>
        <span>Format</span>
        <input
          type="text"
          value={node.format || ''}
          oninput={(e) => onUpdate({ format: (e.target as HTMLInputElement).value })}
          placeholder="{value} HP"
        />
        <span class="help-text">Use {'{value}'} as placeholder for the computed value</span>
      </label>
    </div>
  </div>

  {#if editingFormula}
    <div class="property-group">
      <div class="group-header">
        <h4>Formula Editor</h4>
      </div>
      <div class="group-content">
        <label>
          <span>Formula</span>
          <textarea
            bind:value={formulaInput}
            oninput={() => validateFormula(formulaInput)}
            placeholder="floor((abilities.strength.value - 10) / 2)"
            rows="4"
            class:error={formulaError}
          ></textarea>
          {#if formulaError}
            <span class="error-text">{formulaError}</span>
          {/if}
        </label>

        <div class="formula-help">
          <h5>Available Functions:</h5>
          <ul>
            <li><code>floor(x)</code>, <code>ceil(x)</code>, <code>round(x)</code></li>
            <li><code>abs(x)</code>, <code>sqrt(x)</code></li>
            <li><code>min(a, b, ...)</code>, <code>max(a, b, ...)</code></li>
            <li><code>sum(array)</code>, <code>count(array)</code></li>
            <li><code>if(condition, trueValue, falseValue)</code></li>
          </ul>
          <h5>Operators:</h5>
          <p><code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, <code>%</code>, <code>^</code> (power)</p>
          <p><code>==</code>, <code>!=</code>, <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&gt;=</code></p>
          <p><code>and</code>, <code>or</code>, <code>not</code></p>
        </div>

        <label>
          <span>Test Data (JSON)</span>
          <textarea
            bind:value={testData}
            oninput={() => testWithData(formulaInput)}
            placeholder="Enter JSON test data"
            rows="3"
            class:error={testDataError}
          ></textarea>
          {#if testDataError}
            <span class="error-text">{testDataError}</span>
          {/if}
        </label>

        {#if testResult}
          <div class="test-result" class:error={testResult.startsWith('Error')}>
            {testResult}
          </div>
        {/if}

        <div class="button-group">
          <button
            type="button"
            class="btn-primary"
            onclick={saveFormula}
            disabled={!!formulaError}
          >
            Save Formula
          </button>
          <button
            type="button"
            class="btn-secondary"
            onclick={cancelEditing}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}
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

  .help-text {
    font-size: 0.75rem;
    color: var(--text-muted, #6c757d);
    font-weight: normal;
  }

  .error-text {
    font-size: 0.75rem;
    color: var(--error-color, #c53030);
    font-weight: normal;
  }

  input[type="text"],
  select,
  textarea {
    padding: 0.5rem;
    border: 1px solid var(--input-border, #ced4da);
    border-radius: 4px;
    font-size: 0.875rem;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
  }

  textarea {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    resize: vertical;
  }

  textarea.error {
    border-color: var(--error-color, #c53030);
    background: var(--error-bg-light, #fff5f5);
  }

  input:focus,
  select:focus,
  textarea:focus {
    outline: none;
    border-color: var(--primary-color, #007bff);
  }

  .info-box {
    padding: 0.75rem;
    background: var(--info-bg, #e7f3ff);
    border-left: 3px solid var(--info-border, #0066cc);
    border-radius: 4px;
  }

  .info-box.warning {
    background: var(--warning-bg, #fff9e6);
    border-left-color: var(--warning-border, #d97706);
  }

  .info-box p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-color, #212529);
  }

  .field-info {
    padding: 0.75rem;
    background: var(--bg-subtle, #f8f9fa);
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .info-row {
    display: flex;
    gap: 0.5rem;
    font-size: 0.875rem;
    align-items: baseline;
  }

  .info-row strong {
    min-width: 100px;
    color: var(--label-color, #495057);
  }

  .formula-display {
    flex: 1;
    padding: 0.25rem 0.5rem;
    background: var(--code-bg, #f1f1f1);
    border-radius: 3px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.8125rem;
    overflow-x: auto;
  }

  .formula-help {
    padding: 0.75rem;
    background: var(--help-bg, #f8f9fa);
    border-radius: 4px;
    font-size: 0.8125rem;
  }

  .formula-help h5 {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .formula-help ul {
    margin: 0 0 0.5rem 0;
    padding-left: 1.5rem;
  }

  .formula-help li {
    margin: 0.25rem 0;
  }

  .formula-help p {
    margin: 0.25rem 0;
  }

  .formula-help code {
    background: var(--code-bg, #e9ecef);
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  }

  .test-result {
    padding: 0.75rem;
    background: var(--success-bg, #f0fdf4);
    border-left: 3px solid var(--success-border, #22c55e);
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.875rem;
  }

  .test-result.error {
    background: var(--error-bg, #fff5f5);
    border-left-color: var(--error-border, #ef4444);
    color: var(--error-color, #c53030);
  }

  .button-group {
    display: flex;
    gap: 0.5rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .btn-primary {
    background: var(--primary-color, #007bff);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--primary-hover, #0056b3);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: var(--secondary-color, #6c757d);
    color: white;
  }

  .btn-secondary:hover {
    background: var(--secondary-hover, #545b62);
  }
</style>
