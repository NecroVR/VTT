<script lang="ts">
  import type { LocalizedString } from '@vtt/shared/types/forms';
  import { localeResolver } from '$lib/services/localization';

  interface Props {
    value?: LocalizedString | string;
    label?: string;
    placeholder?: string;
    suggestedPrefix?: string; // e.g., "form.character-sheet.abilities."
    onchange?: (value: LocalizedString) => void;
  }

  let { value = $bindable(), label, placeholder, suggestedPrefix, onchange }: Props = $props();

  // Convert to LocalizedString if it's a plain string
  let localizedValue = $state<LocalizedString>(
    typeof value === 'string' ? { literal: value } : value || {}
  );

  // Mode: 'literal' or 'localeKey'
  let mode = $state<'literal' | 'localeKey'>(
    localizedValue.localeKey ? 'localeKey' : 'literal'
  );

  // Temporary input values
  let literalInput = $state<string>(localizedValue.literal || '');
  let localeKeyInput = $state<string>(localizedValue.localeKey || '');

  // Preview resolved value
  let preview = $derived(localeResolver.resolve(localizedValue));

  // Update the value when inputs change
  function updateValue() {
    if (mode === 'literal') {
      localizedValue = { literal: literalInput };
    } else {
      localizedValue = {
        localeKey: localeKeyInput,
        literal: literalInput, // Keep literal as fallback
      };
    }

    // Update bindable value
    value = localizedValue;

    // Call onChange callback if provided
    onchange?.(localizedValue);
  }

  // Switch between modes
  function toggleMode() {
    mode = mode === 'literal' ? 'localeKey' : 'literal';
    updateValue();
  }

  // Watch for external value changes
  $effect(() => {
    if (typeof value === 'string') {
      localizedValue = { literal: value };
      literalInput = value;
      localeKeyInput = '';
      mode = 'literal';
    } else if (value) {
      localizedValue = value;
      literalInput = value.literal || '';
      localeKeyInput = value.localeKey || '';
      mode = value.localeKey ? 'localeKey' : 'literal';
    }
  });
</script>

<div class="locale-key-picker">
  {#if label}
    <label class="picker-label">{label}</label>
  {/if}

  <div class="picker-controls">
    <!-- Mode Toggle -->
    <div class="mode-toggle">
      <button
        type="button"
        class="mode-button"
        class:active={mode === 'literal'}
        onclick={toggleMode}
      >
        Literal
      </button>
      <button
        type="button"
        class="mode-button"
        class:active={mode === 'localeKey'}
        onclick={toggleMode}
      >
        Locale Key
      </button>
    </div>

    <!-- Inputs based on mode -->
    {#if mode === 'literal'}
      <input
        type="text"
        class="input-field"
        placeholder={placeholder || 'Enter literal text...'}
        bind:value={literalInput}
        oninput={updateValue}
      />
    {:else}
      <div class="locale-key-mode">
        <!-- Locale Key Input -->
        <div class="input-group">
          <label class="input-label">Locale Key</label>
          <input
            type="text"
            class="input-field"
            placeholder={suggestedPrefix
              ? `${suggestedPrefix}label`
              : 'form.{formName}.{nodeId}.{property}'}
            bind:value={localeKeyInput}
            oninput={updateValue}
          />
          {#if suggestedPrefix}
            <div class="input-hint">Suggested: {suggestedPrefix}...</div>
          {/if}
        </div>

        <!-- Fallback Literal Input -->
        <div class="input-group">
          <label class="input-label">Fallback (Literal)</label>
          <input
            type="text"
            class="input-field"
            placeholder={placeholder || 'Enter fallback text...'}
            bind:value={literalInput}
            oninput={updateValue}
          />
          <div class="input-hint">Shown if translation not found</div>
        </div>
      </div>
    {/if}

    <!-- Preview -->
    {#if preview}
      <div class="preview">
        <div class="preview-label">Preview:</div>
        <div class="preview-value">{preview}</div>
      </div>
    {/if}
  </div>
</div>

<style>
  .locale-key-picker {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .picker-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary, #1f2937);
  }

  .picker-controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .mode-toggle {
    display: flex;
    gap: 0.5rem;
    background: var(--bg-secondary, #f3f4f6);
    border-radius: 0.375rem;
    padding: 0.25rem;
  }

  .mode-button {
    flex: 1;
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary, #6b7280);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .mode-button:hover {
    background: var(--bg-hover, #e5e7eb);
  }

  .mode-button.active {
    background: var(--bg-primary, #ffffff);
    color: var(--text-primary, #1f2937);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .input-field {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    background: var(--bg-primary, #ffffff);
    color: var(--text-primary, #1f2937);
    transition: border-color 0.15s ease;
  }

  .input-field:focus {
    outline: none;
    border-color: var(--primary-color, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .locale-key-mode {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .input-label {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-secondary, #6b7280);
  }

  .input-hint {
    font-size: 0.75rem;
    color: var(--text-tertiary, #9ca3af);
    font-style: italic;
  }

  .preview {
    padding: 0.75rem;
    background: var(--bg-secondary, #f9fafb);
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 0.375rem;
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .preview-label {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-secondary, #6b7280);
  }

  .preview-value {
    font-size: 0.875rem;
    color: var(--text-primary, #1f2937);
    font-weight: 500;
  }
</style>
