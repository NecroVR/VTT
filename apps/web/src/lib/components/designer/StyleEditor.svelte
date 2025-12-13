<script lang="ts">
  import type { FormStyles } from '@vtt/shared';
  import { builtInThemes, getThemeNames, type FormTheme } from '$lib/services/formThemes';
  import { sanitizeCustomCss, validateCustomProperties } from '$lib/services/cssSanitizer';

  // Props
  interface Props {
    styles: FormStyles;
    onUpdate: (styles: FormStyles) => void;
  }

  let { styles, onUpdate }: Props = $props();

  // Local state
  let selectedTheme = $state(styles.theme || 'default');
  let customCss = $state(styles.customCSS || '');
  let cssError = $state<string | null>(null);
  let activeTab = $state<'theme' | 'variables' | 'custom'>('theme');

  // Custom variables state
  let customVariables = $state<Record<string, string>>(styles.variables || {});

  // Get available themes
  const themeNames = getThemeNames();

  // Get current theme details
  let currentTheme = $derived(builtInThemes[selectedTheme] || builtInThemes.default);

  // Handle theme selection
  function handleThemeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedTheme = target.value as FormStyles['theme'];
    updateStyles();
  }

  // Handle custom CSS change
  function handleCustomCssChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    customCss = target.value;
    cssError = null;
  }

  // Apply custom CSS
  function applyCustomCss() {
    try {
      const sanitized = sanitizeCustomCss(customCss);
      customCss = sanitized;
      cssError = null;
      updateStyles();
    } catch (error) {
      cssError = error instanceof Error ? error.message : 'Invalid CSS';
    }
  }

  // Handle variable change
  function handleVariableChange(key: string, value: string) {
    customVariables[key] = value;
    updateStyles();
  }

  // Add new custom variable
  function addCustomVariable() {
    const key = prompt('Enter CSS variable name (e.g., --my-color):');
    if (key && key.startsWith('--')) {
      customVariables[key] = '#000000';
      updateStyles();
    }
  }

  // Remove custom variable
  function removeCustomVariable(key: string) {
    delete customVariables[key];
    customVariables = { ...customVariables };
    updateStyles();
  }

  // Update styles in parent
  function updateStyles() {
    const validated = validateCustomProperties(customVariables);
    onUpdate({
      theme: selectedTheme,
      customCSS: customCss,
      variables: validated
    });
  }

  // Preset color variables from theme
  const themeColorVariables = $derived([
    { key: '--form-primary-color', label: 'Primary Color', value: currentTheme.colors.primary },
    { key: '--form-secondary-color', label: 'Secondary Color', value: currentTheme.colors.secondary },
    { key: '--form-bg-color', label: 'Background', value: currentTheme.colors.background },
    { key: '--form-surface-color', label: 'Surface', value: currentTheme.colors.surface },
    { key: '--form-text-color', label: 'Text', value: currentTheme.colors.text },
    { key: '--form-border-color', label: 'Border', value: currentTheme.colors.border }
  ]);
</script>

<div class="style-editor">
  <div class="tabs">
    <button
      class="tab"
      class:active={activeTab === 'theme'}
      onclick={() => activeTab = 'theme'}
    >
      Theme
    </button>
    <button
      class="tab"
      class:active={activeTab === 'variables'}
      onclick={() => activeTab = 'variables'}
    >
      Variables
    </button>
    <button
      class="tab"
      class:active={activeTab === 'custom'}
      onclick={() => activeTab = 'custom'}
    >
      Custom CSS
    </button>
  </div>

  <div class="tab-content">
    {#if activeTab === 'theme'}
      <div class="theme-section">
        <div class="form-group">
          <label for="theme-select">Select Theme</label>
          <select
            id="theme-select"
            class="form-control"
            value={selectedTheme}
            onchange={handleThemeChange}
          >
            {#each themeNames as themeName}
              {@const theme = builtInThemes[themeName]}
              <option value={themeName}>
                {theme.name} - {theme.description}
              </option>
            {/each}
          </select>
        </div>

        <div class="theme-preview">
          <h4>Theme Preview</h4>
          <div class="preview-colors">
            <div class="color-item">
              <div class="color-swatch" style:background-color={currentTheme.colors.primary}></div>
              <span>Primary</span>
            </div>
            <div class="color-item">
              <div class="color-swatch" style:background-color={currentTheme.colors.secondary}></div>
              <span>Secondary</span>
            </div>
            <div class="color-item">
              <div class="color-swatch" style:background-color={currentTheme.colors.background}></div>
              <span>Background</span>
            </div>
            <div class="color-item">
              <div class="color-swatch" style:background-color={currentTheme.colors.text}></div>
              <span>Text</span>
            </div>
          </div>
        </div>
      </div>
    {:else if activeTab === 'variables'}
      <div class="variables-section">
        <div class="section-header">
          <h4>Theme Variables</h4>
          <button class="btn-add" onclick={addCustomVariable}>+ Add Variable</button>
        </div>

        <div class="variables-list">
          <h5>Theme Colors (Override)</h5>
          {#each themeColorVariables as { key, label, value }}
            <div class="variable-item">
              <label>{label}</label>
              <div class="variable-controls">
                <input
                  type="color"
                  value={customVariables[key] || value}
                  oninput={(e) => handleVariableChange(key, (e.target as HTMLInputElement).value)}
                />
                <input
                  type="text"
                  class="color-input"
                  value={customVariables[key] || value}
                  oninput={(e) => handleVariableChange(key, (e.target as HTMLInputElement).value)}
                />
              </div>
            </div>
          {/each}

          {#if Object.keys(customVariables).some(k => !themeColorVariables.find(v => v.key === k))}
            <h5>Custom Variables</h5>
            {#each Object.entries(customVariables) as [key, value]}
              {#if !themeColorVariables.find(v => v.key === key)}
                <div class="variable-item">
                  <label>{key}</label>
                  <div class="variable-controls">
                    <input
                      type="text"
                      class="full-input"
                      value={value}
                      oninput={(e) => handleVariableChange(key, (e.target as HTMLInputElement).value)}
                    />
                    <button
                      class="btn-remove"
                      onclick={() => removeCustomVariable(key)}
                      title="Remove variable"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              {/if}
            {/each}
          {/if}
        </div>
      </div>
    {:else if activeTab === 'custom'}
      <div class="custom-css-section">
        <div class="section-header">
          <h4>Custom CSS</h4>
          <button class="btn-apply" onclick={applyCustomCss}>Apply & Sanitize</button>
        </div>

        {#if cssError}
          <div class="error-message">{cssError}</div>
        {/if}

        <div class="css-help">
          <p>Enter custom CSS rules. Only safe properties are allowed.</p>
          <details>
            <summary>Allowed Properties</summary>
            <p class="help-text">
              color, background-color, font-size, font-family, border, padding, margin,
              width, height, display, flex, grid, opacity, box-shadow, and more.
            </p>
          </details>
        </div>

        <textarea
          class="css-editor"
          value={customCss}
          oninput={handleCustomCssChange}
          placeholder=".my-field {'{'}&#10;  color: #333;&#10;  font-size: 1.2rem;&#10;{'}'}"
        ></textarea>
      </div>
    {/if}
  </div>
</div>

<style>
  .style-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: white;
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color, #ddd);
    background: var(--surface-color, #f8f9fa);
  }

  .tab {
    padding: 0.75rem 1.5rem;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-weight: 500;
    color: var(--text-muted, #6c757d);
    transition: all 0.2s;
  }

  .tab:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .tab.active {
    color: var(--primary-color, #007bff);
    border-bottom-color: var(--primary-color, #007bff);
  }

  .tab-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .theme-section,
  .variables-section,
  .custom-css-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--text-color, #333);
  }

  .form-control {
    padding: 0.5rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .form-control:focus {
    outline: none;
    border-color: var(--primary-color, #007bff);
  }

  .theme-preview {
    padding: 1rem;
    background: var(--surface-color, #f8f9fa);
    border-radius: 4px;
  }

  .theme-preview h4 {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-muted, #6c757d);
  }

  .preview-colors {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 1rem;
  }

  .color-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .color-swatch {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    border: 2px solid var(--border-color, #ddd);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .color-item span {
    font-size: 0.75rem;
    color: var(--text-muted, #6c757d);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .section-header h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-muted, #6c757d);
  }

  .btn-add,
  .btn-apply {
    padding: 0.5rem 1rem;
    background: var(--primary-color, #007bff);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-add:hover,
  .btn-apply:hover {
    background: var(--primary-color-hover, #0056b3);
  }

  .variables-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .variables-list h5 {
    margin: 0.5rem 0 0 0;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-muted, #6c757d);
  }

  .variable-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .variable-item label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-color, #333);
  }

  .variable-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .variable-controls input[type="color"] {
    width: 50px;
    height: 36px;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    cursor: pointer;
  }

  .color-input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    font-size: 0.875rem;
    font-family: monospace;
  }

  .full-input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    font-size: 0.875rem;
    font-family: monospace;
  }

  .btn-remove {
    padding: 0.5rem 0.75rem;
    background: var(--error-color, #dc3545);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: background 0.2s;
  }

  .btn-remove:hover {
    background: #c82333;
  }

  .error-message {
    padding: 0.75rem;
    background: var(--error-bg, #f8d7da);
    color: var(--error-color, #721c24);
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .css-help {
    padding: 1rem;
    background: var(--surface-color, #f8f9fa);
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .css-help p {
    margin: 0;
  }

  .css-help details {
    margin-top: 0.5rem;
  }

  .css-help summary {
    cursor: pointer;
    font-weight: 600;
    color: var(--primary-color, #007bff);
  }

  .help-text {
    margin-top: 0.5rem;
    color: var(--text-muted, #6c757d);
    font-size: 0.8rem;
    line-height: 1.5;
  }

  .css-editor {
    width: 100%;
    min-height: 300px;
    padding: 1rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.875rem;
    resize: vertical;
  }

  .css-editor:focus {
    outline: none;
    border-color: var(--primary-color, #007bff);
  }
</style>
