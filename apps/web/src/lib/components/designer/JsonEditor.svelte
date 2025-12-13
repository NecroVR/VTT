<script lang="ts">
  import type { FormDefinition } from '@vtt/shared';

  // Props
  interface Props {
    form: FormDefinition | null;
    onApply: (formJson: string) => void;
  }

  let { form, onApply }: Props = $props();

  // Local state
  let jsonText = $state('');
  let validationError = $state<string | null>(null);
  let autoSync = $state(false);
  let hasUnsavedChanges = $state(false);

  // Update JSON text when form changes
  $effect(() => {
    if (form) {
      const formatted = JSON.stringify(form, null, 2);
      if (jsonText !== formatted && !hasUnsavedChanges) {
        jsonText = formatted;
      }
    }
  });

  // Handle text input
  function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    jsonText = target.value;
    hasUnsavedChanges = true;

    // Clear previous validation error
    validationError = null;

    // Auto-sync if enabled
    if (autoSync) {
      validateAndApply();
    }
  }

  // Validate JSON
  function validate(): { valid: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonText);

      // Basic structure validation
      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'Invalid form structure: must be an object' };
      }

      // Check required fields
      if (!parsed.id || typeof parsed.id !== 'string') {
        return { valid: false, error: 'Missing or invalid required field: id' };
      }

      if (!parsed.name || typeof parsed.name !== 'string') {
        return { valid: false, error: 'Missing or invalid required field: name' };
      }

      if (!parsed.layout || !Array.isArray(parsed.layout)) {
        return { valid: false, error: 'Missing or invalid required field: layout (must be an array)' };
      }

      // Validate layout nodes have required fields
      const validateNode = (node: any, path: string): string | null => {
        if (!node || typeof node !== 'object') {
          return `Invalid node at ${path}: must be an object`;
        }

        if (!node.id || typeof node.id !== 'string') {
          return `Invalid node at ${path}: missing or invalid id`;
        }

        if (!node.type || typeof node.type !== 'string') {
          return `Invalid node at ${path}: missing or invalid type`;
        }

        // Recursively validate children arrays
        if (node.children && Array.isArray(node.children)) {
          for (let i = 0; i < node.children.length; i++) {
            const error = validateNode(node.children[i], `${path}.children[${i}]`);
            if (error) return error;
          }
        }

        // Validate tabs
        if (node.tabs && Array.isArray(node.tabs)) {
          for (let i = 0; i < node.tabs.length; i++) {
            const tab = node.tabs[i];
            if (!tab.id || !tab.children || !Array.isArray(tab.children)) {
              return `Invalid tab at ${path}.tabs[${i}]: missing id or children`;
            }
            for (let j = 0; j < tab.children.length; j++) {
              const error = validateNode(tab.children[j], `${path}.tabs[${i}].children[${j}]`);
              if (error) return error;
            }
          }
        }

        // Validate itemTemplate (repeater)
        if (node.itemTemplate && Array.isArray(node.itemTemplate)) {
          for (let i = 0; i < node.itemTemplate.length; i++) {
            const error = validateNode(node.itemTemplate[i], `${path}.itemTemplate[${i}]`);
            if (error) return error;
          }
        }

        // Validate conditional branches
        if (node.then && Array.isArray(node.then)) {
          for (let i = 0; i < node.then.length; i++) {
            const error = validateNode(node.then[i], `${path}.then[${i}]`);
            if (error) return error;
          }
        }
        if (node.else && Array.isArray(node.else)) {
          for (let i = 0; i < node.else.length; i++) {
            const error = validateNode(node.else[i], `${path}.else[${i}]`);
            if (error) return error;
          }
        }

        return null;
      };

      // Validate all root layout nodes
      for (let i = 0; i < parsed.layout.length; i++) {
        const error = validateNode(parsed.layout[i], `layout[${i}]`);
        if (error) {
          return { valid: false, error };
        }
      }

      return { valid: true };
    } catch (err) {
      if (err instanceof SyntaxError) {
        return { valid: false, error: `JSON Syntax Error: ${err.message}` };
      }
      return { valid: false, error: `Validation Error: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  // Validate and show errors
  function handleValidate() {
    const result = validate();
    if (result.valid) {
      validationError = null;
      alert('JSON is valid!');
    } else {
      validationError = result.error || 'Unknown validation error';
    }
  }

  // Format/prettify JSON
  function handleFormat() {
    try {
      const parsed = JSON.parse(jsonText);
      jsonText = JSON.stringify(parsed, null, 2);
      hasUnsavedChanges = true;
      validationError = null;
    } catch (err) {
      validationError = `Cannot format invalid JSON: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  // Apply changes
  function validateAndApply(): boolean {
    const result = validate();
    if (result.valid) {
      validationError = null;
      onApply(jsonText);
      hasUnsavedChanges = false;
      return true;
    } else {
      validationError = result.error || 'Unknown validation error';
      return false;
    }
  }

  function handleApply() {
    validateAndApply();
  }

  // Discard changes
  function handleDiscard() {
    if (form) {
      jsonText = JSON.stringify(form, null, 2);
      hasUnsavedChanges = false;
      validationError = null;
    }
  }

  // Toggle auto-sync
  function handleAutoSyncToggle() {
    autoSync = !autoSync;
    if (autoSync) {
      validateAndApply();
    }
  }
</script>

<div class="json-editor">
  <!-- Toolbar -->
  <div class="editor-toolbar">
    <div class="toolbar-left">
      <button
        type="button"
        class="btn btn-sm"
        onclick={handleFormat}
        title="Format/Prettify JSON"
      >
        Format
      </button>
      <button
        type="button"
        class="btn btn-sm"
        onclick={handleValidate}
        title="Validate JSON structure"
      >
        Validate
      </button>
    </div>

    <div class="toolbar-center">
      {#if hasUnsavedChanges}
        <span class="unsaved-indicator">Unsaved changes</span>
      {:else}
        <span class="saved-indicator">Synced</span>
      {/if}
    </div>

    <div class="toolbar-right">
      <label class="auto-sync-toggle">
        <input
          type="checkbox"
          checked={autoSync}
          onchange={handleAutoSyncToggle}
        />
        <span>Auto-sync</span>
      </label>

      {#if hasUnsavedChanges}
        <button
          type="button"
          class="btn btn-sm btn-secondary"
          onclick={handleDiscard}
          title="Discard changes"
        >
          Discard
        </button>
        <button
          type="button"
          class="btn btn-sm btn-primary"
          onclick={handleApply}
          title="Apply changes to visual editor"
        >
          Apply
        </button>
      {/if}
    </div>
  </div>

  <!-- Validation Error -->
  {#if validationError}
    <div class="validation-error">
      <span class="error-icon">⚠</span>
      <span class="error-message">{validationError}</span>
      <button onclick={() => validationError = null} class="error-close">✕</button>
    </div>
  {/if}

  <!-- JSON Text Area -->
  <div class="editor-container">
    <div class="line-numbers" aria-hidden="true">
      {#each jsonText.split('\n') as _, i}
        <div class="line-number">{i + 1}</div>
      {/each}
    </div>
    <textarea
      class="json-textarea"
      value={jsonText}
      oninput={handleInput}
      spellcheck={false}
      placeholder="JSON will appear here..."
    ></textarea>
  </div>

  <!-- Help Text -->
  <div class="editor-footer">
    <p class="help-text">
      Edit the JSON directly for advanced customization. Changes will sync to the visual editor when applied.
    </p>
  </div>
</div>

<style>
  .json-editor {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--bg-color, #ffffff);
  }

  /* Toolbar */
  .editor-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    background: var(--toolbar-bg, #f8f9fa);
    border-bottom: 1px solid var(--border-color, #ddd);
    gap: 1rem;
    flex-shrink: 0;
  }

  .toolbar-left,
  .toolbar-right {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .toolbar-center {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  .btn {
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .btn:hover {
    background: var(--hover-bg, #f0f0f0);
  }

  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.8125rem;
  }

  .btn-primary {
    background: var(--primary-color, #007bff);
    color: white;
    border-color: var(--primary-color, #007bff);
  }

  .btn-primary:hover {
    background: var(--primary-color-hover, #0056b3);
    border-color: var(--primary-color-hover, #0056b3);
  }

  .btn-secondary {
    background: var(--secondary-bg, #6c757d);
    color: white;
    border-color: var(--secondary-bg, #6c757d);
  }

  .btn-secondary:hover {
    background: var(--secondary-bg-hover, #5a6268);
    border-color: var(--secondary-bg-hover, #5a6268);
  }

  .auto-sync-toggle {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
    cursor: pointer;
    user-select: none;
  }

  .auto-sync-toggle input[type="checkbox"] {
    cursor: pointer;
  }

  .unsaved-indicator {
    font-size: 0.875rem;
    color: var(--warning-color, #ff9800);
    font-weight: 500;
  }

  .saved-indicator {
    font-size: 0.875rem;
    color: var(--success-color, #28a745);
    font-weight: 500;
  }

  /* Validation Error */
  .validation-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--error-bg, #f8d7da);
    color: var(--error-color, #721c24);
    border-bottom: 1px solid var(--error-border, #f5c6cb);
    font-size: 0.875rem;
    flex-shrink: 0;
  }

  .error-icon {
    font-size: 1.125rem;
  }

  .error-message {
    flex: 1;
  }

  .error-close {
    background: transparent;
    border: none;
    font-size: 1.125rem;
    cursor: pointer;
    padding: 0 0.25rem;
    color: inherit;
  }

  .error-close:hover {
    opacity: 0.7;
  }

  /* Editor Container */
  .editor-container {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
    background: var(--editor-bg, #1e1e1e);
  }

  .line-numbers {
    padding: 1rem 0.5rem;
    background: var(--line-numbers-bg, #2d2d2d);
    color: var(--line-numbers-color, #858585);
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.875rem;
    line-height: 1.5;
    text-align: right;
    user-select: none;
    border-right: 1px solid var(--border-color, #444);
    overflow: hidden;
    flex-shrink: 0;
  }

  .line-number {
    padding-right: 0.5rem;
  }

  .json-textarea {
    flex: 1;
    padding: 1rem;
    background: var(--editor-bg, #1e1e1e);
    color: var(--editor-text, #d4d4d4);
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.875rem;
    line-height: 1.5;
    border: none;
    outline: none;
    resize: none;
    overflow: auto;
    white-space: pre;
    word-wrap: normal;
    overflow-wrap: normal;
  }

  .json-textarea::placeholder {
    color: var(--placeholder-color, #858585);
  }

  /* Scrollbar styling for dark theme */
  .json-textarea::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }

  .json-textarea::-webkit-scrollbar-track {
    background: var(--scrollbar-track, #1e1e1e);
  }

  .json-textarea::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb, #424242);
    border-radius: 6px;
  }

  .json-textarea::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover, #4e4e4e);
  }

  /* Footer */
  .editor-footer {
    padding: 0.5rem 1rem;
    background: var(--footer-bg, #f8f9fa);
    border-top: 1px solid var(--border-color, #ddd);
    flex-shrink: 0;
  }

  .help-text {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--text-muted, #6c757d);
    text-align: center;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .editor-toolbar {
      flex-wrap: wrap;
    }

    .toolbar-center {
      order: -1;
      width: 100%;
      margin-bottom: 0.5rem;
    }

    .line-numbers {
      display: none;
    }
  }
</style>
