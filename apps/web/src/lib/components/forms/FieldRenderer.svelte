<script lang="ts">
  import type { FieldNode } from '@vtt/shared';
  import { localeResolver } from '$lib/services/localization';
  import { sanitizeStyles } from '$lib/utils/cssSanitizer';
  import DOMPurify from 'isomorphic-dompurify';

  interface Props {
    node: FieldNode;
    entity: Record<string, unknown>;
    mode: 'view' | 'edit';
    onChange: (path: string, value: unknown) => void;
    repeaterContext?: { index: number; item: unknown };
  }

  let { node, entity, mode, onChange, repeaterContext }: Props = $props();

  // Resolve localized strings
  let label = $derived(localeResolver.resolve(node.label));
  let helpText = $derived(localeResolver.resolve(node.helpText));
  let placeholder = $derived(localeResolver.resolve(node.options?.placeholder));

  // Resolve binding path (handle {{index}} for repeaters)
  let resolvedBinding = $derived.by(() => {
    let path = node.binding;
    if (repeaterContext && path.includes('{{index}}')) {
      path = path.replace(/\{\{index\}\}/g, String(repeaterContext.index));
    }
    return path;
  });

  // Get current value
  let value = $derived.by(() => {
    return resolvedBinding.split('.').reduce((obj, key) => {
      if (obj == null) return undefined;
      const match = key.match(/^(.+)\[(\d+)\]$/);
      if (match) {
        const arr = (obj as Record<string, unknown>)[match[1]] as unknown[];
        return arr?.[parseInt(match[2])];
      }
      return (obj as Record<string, unknown>)[key];
    }, entity as unknown);
  });

  function handleChange(newValue: unknown) {
    onChange(resolvedBinding, newValue);
  }

  // Sanitize HTML content to prevent XSS attacks in rich text fields
  function sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'b', 'i', 's', 'del', 'ins',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'a', 'span', 'div',
        'blockquote', 'code', 'pre',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'hr', 'sup', 'sub'
      ],
      ALLOWED_ATTR: ['href', 'title', 'class', 'id', 'style'],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'style'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
    });
  }
</script>

<div class="field-wrapper" class:required={node.required}>
  {#if label}
    <label class="field-label" for="field-{node.id}">
      {label}
      {#if node.required}<span class="required-indicator" aria-label="required">*</span>{/if}
    </label>
  {/if}

  {#if mode === 'view'}
    <div class="field-value">
      {#if node.fieldType === 'checkbox'}
        {value ? '✓' : '✗'}
      {:else if node.fieldType === 'select' && node.options?.options}
        {node.options.options.find(o => o.value === value)?.label || value}
      {:else if node.fieldType === 'resource'}
        <div class="field-resource-view">
          {(value as {current?: number})?.current ?? value ?? 0}
          {#if node.options?.showMax}
            <span class="resource-separator">/</span>
            {(value as {max?: number})?.max ?? 0}
          {/if}
        </div>
      {:else if node.fieldType === 'rating'}
        <div class="rating-view">
          {#each Array(node.options?.max ?? 5) as _, i}
            <span class="rating-icon {(value as number ?? 0) > i ? 'filled' : ''}">
              {node.options?.iconStyle === 'circles' ? '●' : node.options?.iconStyle === 'pips' ? '♦' : '★'}
            </span>
          {/each}
        </div>
      {:else if node.fieldType === 'tags'}
        <div class="tags-view">
          {#each (value as string[] ?? []) as tag}
            <span class="tag-badge">{tag}</span>
          {/each}
        </div>
      {:else if node.fieldType === 'color'}
        <div class="color-view">
          <span class="color-swatch" style={sanitizeStyles({ 'background-color': value ?? '#000000' })}></span>
          <span class="color-value">{value ?? '#000000'}</span>
        </div>
      {:else if node.fieldType === 'image'}
        {#if value}
          <img src={value as string} alt={label ?? ''} class="image-preview" />
        {:else}
          <span class="text-gray-400">No image</span>
        {/if}
      {:else if node.fieldType === 'richtext'}
        <div class="richtext-view">{@html sanitizeHtml(String(value ?? ''))}</div>
      {:else}
        {value ?? '-'}
      {/if}
    </div>
  {:else}
    {#if node.fieldType === 'text'}
      <input
        id="field-{node.id}"
        type="text"
        class="field-input"
        value={value ?? ''}
        readonly={node.readonly}
        placeholder={placeholder}
        aria-label={label ?? 'Text field'}
        aria-required={node.required}
        aria-describedby={helpText ? `help-{node.id}` : undefined}
        oninput={(e) => handleChange(e.currentTarget.value)}
      />
    {:else if node.fieldType === 'number'}
      <input
        id="field-{node.id}"
        type="number"
        class="field-input"
        value={value ?? ''}
        readonly={node.readonly}
        min={node.options?.min}
        max={node.options?.max}
        step={node.options?.step}
        aria-label={label ?? 'Number field'}
        aria-required={node.required}
        aria-describedby={helpText ? `help-{node.id}` : undefined}
        oninput={(e) => handleChange(parseFloat(e.currentTarget.value) || 0)}
      />
    {:else if node.fieldType === 'textarea'}
      <textarea
        id="field-{node.id}"
        class="field-input field-textarea"
        value={value ?? ''}
        readonly={node.readonly}
        placeholder={placeholder}
        aria-label={label ?? 'Text area'}
        aria-required={node.required}
        aria-describedby={helpText ? `help-{node.id}` : undefined}
        oninput={(e) => handleChange(e.currentTarget.value)}
      ></textarea>
    {:else if node.fieldType === 'checkbox'}
      <input
        id="field-{node.id}"
        type="checkbox"
        class="field-checkbox"
        checked={!!value}
        disabled={node.readonly}
        aria-label={label ?? 'Checkbox'}
        aria-required={node.required}
        aria-describedby={helpText ? `help-{node.id}` : undefined}
        onchange={(e) => handleChange(e.currentTarget.checked)}
      />
    {:else if node.fieldType === 'select'}
      <select
        id="field-{node.id}"
        class="field-input field-select"
        value={value ?? ''}
        disabled={node.readonly}
        aria-label={label ?? 'Select field'}
        aria-required={node.required}
        aria-describedby={helpText ? `help-{node.id}` : undefined}
        onchange={(e) => handleChange(e.currentTarget.value)}
      >
        <option value="">--Select--</option>
        {#each node.options?.options || [] as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    {:else if node.fieldType === 'dice'}
      <input
        type="text"
        class="field-input"
        value={value ?? ''}
        readonly={node.readonly}
        placeholder="e.g., 2d6+3"
        pattern="[0-9]*d[0-9]+([+-][0-9]+)?"
        oninput={(e) => handleChange(e.currentTarget.value)}
      />
    {:else if node.fieldType === 'resource'}
      <div class="field-resource">
        <input
          type="number"
          class="field-input resource-current"
          value={(value as {current?: number})?.current ?? value ?? 0}
          readonly={node.readonly}
          oninput={(e) => handleChange({
            ...(typeof value === 'object' ? value : {}),
            current: parseFloat(e.currentTarget.value) || 0
          })}
        />
        {#if node.options?.showMax}
          <span class="resource-separator">/</span>
          <input
            type="number"
            class="field-input resource-max"
            value={(value as {max?: number})?.max ?? 0}
            readonly={node.readonly}
            oninput={(e) => handleChange({
              ...(typeof value === 'object' ? value : {}),
              max: parseFloat(e.currentTarget.value) || 0
            })}
          />
        {/if}
        {#if node.options?.showBar && node.options?.showMax}
          {@const barWidth = Math.min(100, ((value as {current?: number})?.current ?? 0) / ((value as {max?: number})?.max ?? 1) * 100)}
          {@const barStyles = {
            width: `${barWidth}%`,
            'background-color': node.options?.barColor ?? '#4CAF50'
          }}
          <div class="resource-bar">
            <div
              class="resource-bar-fill"
              style={sanitizeStyles(barStyles)}
            ></div>
          </div>
        {/if}
      </div>
    {:else if node.fieldType === 'rating'}
      <div class="rating-input">
        {#each Array(node.options?.max ?? 5) as _, i}
          <button
            type="button"
            class="rating-button {(value as number ?? 0) > i ? 'filled' : ''}"
            disabled={node.readonly}
            onclick={() => handleChange(i + 1)}
          >
            {node.options?.iconStyle === 'circles' ? '●' : node.options?.iconStyle === 'pips' ? '♦' : '★'}
          </button>
        {/each}
      </div>
    {:else if node.fieldType === 'slider'}
      <div class="slider-wrapper">
        <input
          type="range"
          class="field-slider"
          value={value as number ?? node.options?.min ?? 0}
          min={node.options?.min ?? 0}
          max={node.options?.max ?? 100}
          step={node.options?.step ?? 1}
          disabled={node.readonly}
          oninput={(e) => handleChange(parseFloat(e.currentTarget.value))}
        />
        {#if node.options?.showValue}
          <span class="slider-value">{value ?? node.options?.min ?? 0}</span>
        {/if}
      </div>
    {:else if node.fieldType === 'tags'}
      <div class="tags-input">
        <div class="tags-list">
          {#each (value as string[] ?? []) as tag, i}
            <span class="tag-badge">
              {tag}
              {#if !node.readonly}
                <button
                  type="button"
                  class="tag-remove"
                  onclick={() => {
                    const tags = [...(value as string[] ?? [])];
                    tags.splice(i, 1);
                    handleChange(tags);
                  }}
                >×</button>
              {/if}
            </span>
          {/each}
        </div>
        {#if !node.readonly}
          <input
            type="text"
            class="field-input tag-add-input"
            placeholder="Add tag..."
            onkeydown={(e) => {
              if ((e.key === 'Enter' || e.key === ',') && e.currentTarget.value.trim()) {
                e.preventDefault();
                const tags = [...(value as string[] ?? []), e.currentTarget.value.trim()];
                handleChange(tags);
                e.currentTarget.value = '';
              }
            }}
          />
          {#if node.options?.suggestions && node.options.suggestions.length > 0}
            <div class="tag-suggestions">
              {#each node.options.suggestions as suggestion}
                <button
                  type="button"
                  class="tag-suggestion"
                  onclick={() => {
                    if (!(value as string[] ?? []).includes(suggestion)) {
                      handleChange([...(value as string[] ?? []), suggestion]);
                    }
                  }}
                >{suggestion}</button>
              {/each}
            </div>
          {/if}
        {/if}
      </div>
    {:else if node.fieldType === 'reference'}
      <input
        type="text"
        class="field-input"
        value={value ?? ''}
        readonly={node.readonly}
        placeholder={`Select ${node.options?.entityType ?? 'entity'}...`}
        oninput={(e) => handleChange(e.currentTarget.value)}
      />
    {:else if node.fieldType === 'richtext'}
      <div class="richtext-editor">
        <textarea
          class="field-input field-textarea richtext-textarea"
          value={value ?? ''}
          readonly={node.readonly}
          placeholder="Enter markdown..."
          oninput={(e) => handleChange(e.currentTarget.value)}
        ></textarea>
        {#if node.options?.showPreview && value}
          <div class="richtext-preview">
            <div class="richtext-preview-label">Preview:</div>
            <div class="richtext-content">{@html sanitizeHtml(String(value))}</div>
          </div>
        {/if}
      </div>
    {:else if node.fieldType === 'color'}
      <div class="color-picker">
        <input
          type="color"
          class="color-input"
          value={value ?? '#000000'}
          disabled={node.readonly}
          oninput={(e) => handleChange(e.currentTarget.value)}
        />
        <input
          type="text"
          class="field-input color-text"
          value={value ?? '#000000'}
          readonly={node.readonly}
          pattern="#[0-9A-Fa-f]{6}"
          oninput={(e) => handleChange(e.currentTarget.value)}
        />
        {#if node.options?.presets && node.options.presets.length > 0}
          <div class="color-presets">
            {#each node.options.presets as preset}
              <button
                type="button"
                class="color-preset"
                style={sanitizeStyles({ 'background-color': preset })}
                disabled={node.readonly}
                onclick={() => handleChange(preset)}
                title={preset}
              ></button>
            {/each}
          </div>
        {/if}
      </div>
    {:else if node.fieldType === 'image'}
      <div class="image-field">
        <input
          type="text"
          class="field-input"
          value={value ?? ''}
          readonly={node.readonly}
          placeholder="Enter image URL..."
          oninput={(e) => handleChange(e.currentTarget.value)}
        />
        {#if value}
          <img src={value as string} alt="Preview" class="image-preview-small" />
        {/if}
      </div>
    {:else if node.fieldType === 'date'}
      <input
        type={node.options?.includeTime ? 'datetime-local' : 'date'}
        class="field-input"
        value={value ?? ''}
        readonly={node.readonly}
        oninput={(e) => handleChange(e.currentTarget.value)}
      />
    {:else}
      <!-- Default fallback to text input -->
      <input
        type="text"
        class="field-input"
        value={value ?? ''}
        oninput={(e) => handleChange(e.currentTarget.value)}
      />
    {/if}
  {/if}

  {#if helpText}
    <div class="field-help" id="help-{node.id}">{helpText}</div>
  {/if}
</div>

<style>
  .field-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.5rem;
  }

  .field-label {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .required-indicator { color: #c00; }

  .field-input {
    padding: 0.5rem;
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
    font-size: 1rem;
  }

  .field-input:focus {
    outline: none;
    border-color: var(--primary-color, #007bff);
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  .field-input:read-only {
    background: var(--bg-muted, #f5f5f5);
  }

  .field-textarea {
    min-height: 80px;
    resize: vertical;
  }

  .field-value {
    padding: 0.5rem 0;
  }

  .field-help {
    font-size: 0.75rem;
    color: var(--muted-color, #666);
  }

  .field-resource {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .resource-current, .resource-max {
    width: 60px;
    text-align: center;
  }

  .resource-separator {
    font-weight: bold;
  }

  .field-resource-view {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .resource-bar {
    width: 100%;
    height: 8px;
    background: var(--bg-muted, #e0e0e0);
    border-radius: 4px;
    overflow: hidden;
    margin-top: 0.25rem;
  }

  .resource-bar-fill {
    height: 100%;
    transition: width 0.3s ease;
  }

  /* Rating field styles */
  .rating-view, .rating-input {
    display: flex;
    gap: 0.25rem;
  }

  .rating-icon {
    font-size: 1.5rem;
    color: var(--muted-color, #ccc);
  }

  .rating-icon.filled {
    color: var(--primary-color, #ffc107);
  }

  .rating-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--muted-color, #ccc);
    cursor: pointer;
    padding: 0;
    transition: color 0.2s;
  }

  .rating-button:hover:not(:disabled) {
    color: var(--primary-color, #ffc107);
  }

  .rating-button.filled {
    color: var(--primary-color, #ffc107);
  }

  .rating-button:disabled {
    cursor: not-allowed;
  }

  /* Slider field styles */
  .slider-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .field-slider {
    flex: 1;
    height: 6px;
    border-radius: 3px;
  }

  .slider-value {
    min-width: 3rem;
    text-align: right;
    font-weight: 500;
  }

  /* Tags field styles */
  .tags-input {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .tags-list, .tags-view {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .tag-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: var(--primary-color, #007bff);
    color: white;
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .tag-remove {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 0;
    font-size: 1rem;
    line-height: 1;
  }

  .tag-remove:hover {
    color: #ff0000;
  }

  .tag-add-input {
    flex: 1;
  }

  .tag-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .tag-suggestion {
    padding: 0.25rem 0.5rem;
    background: var(--bg-muted, #f0f0f0);
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .tag-suggestion:hover {
    background: var(--hover-bg, #e0e0e0);
  }

  /* Color field styles */
  .color-picker {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .color-input {
    width: 50px;
    height: 38px;
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
    cursor: pointer;
  }

  .color-text {
    width: 100px;
  }

  .color-view {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .color-swatch {
    width: 30px;
    height: 30px;
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
  }

  .color-value {
    font-family: monospace;
    font-size: 0.875rem;
  }

  .color-presets {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .color-preset {
    width: 30px;
    height: 30px;
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
    cursor: pointer;
  }

  .color-preset:hover {
    box-shadow: 0 0 0 2px var(--primary-color, #007bff);
  }

  /* Image field styles */
  .image-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .image-preview {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
    border-radius: 4px;
  }

  .image-preview-small {
    max-width: 200px;
    max-height: 100px;
    object-fit: contain;
    border-radius: 4px;
    border: 1px solid var(--border-color, #ccc);
  }

  /* Rich text field styles */
  .richtext-editor {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .richtext-textarea {
    min-height: 120px;
  }

  .richtext-preview {
    padding: 0.5rem;
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
    background: var(--bg-muted, #f9f9f9);
  }

  .richtext-preview-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--muted-color, #666);
    margin-bottom: 0.25rem;
  }

  .richtext-content {
    font-size: 0.875rem;
  }

  .richtext-view {
    padding: 0.5rem 0;
  }
</style>
