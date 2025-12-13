<script lang="ts">
  import type { FieldNode } from '@vtt/shared';
  import { localeResolver } from '$lib/services/localization';
  import { sanitizeStyles } from '$lib/utils/cssSanitizer';
  import DOMPurify from 'isomorphic-dompurify';
  import CodeEditor from './CodeEditor.svelte';
  import RichTextEditorWrapper from './RichTextEditorWrapper.svelte';
  import { contextMenu } from '$lib/actions/contextMenu';
  import type { ContextMenuEntry } from '$lib/types/contextMenu';

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

  // Multiselect search query state
  let searchQuery = $state('');
  // File upload state
  let fileError = $state('');
  let uploadProgress = $state(0);
  let isUploading = $state(false);

  // Validate file type
  function validateFileType(file: File, accept?: string): boolean {
    if (!accept) return true;
    const acceptTypes = accept.split(',').map(t => t.trim());
    return acceptTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });
  }

  // Format file size for display
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // Convert file to base64
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.onprogress = (e) => {
        if (e.lengthComputable) uploadProgress = (e.loaded / e.total) * 100;
      };
      reader.readAsDataURL(file);
    });
  }

  // Handle file selection
  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;
    await processFiles(Array.from(files));
    input.value = ''; // Reset for re-selection
  }

  // Handle drag and drop
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files?.length) processFiles(Array.from(files));
  }

  // Process selected files
  async function processFiles(files: File[]) {
    const accept = node.options?.accept as string | undefined;
    const maxSize = (node.options?.maxSize as number) || 10 * 1024 * 1024; // 10MB default
    const multiple = node.options?.multiple;

    fileError = '';

    for (const file of files) {
      // Validate type
      if (!validateFileType(file, accept)) {
        fileError = `Invalid file type. Accepted: ${accept}`;
        continue;
      }
      // Validate size
      if (file.size > maxSize) {
        fileError = `File too large. Maximum: ${formatFileSize(maxSize)}`;
        continue;
      }

      isUploading = true;
      uploadProgress = 0;

      try {
        const base64 = await fileToBase64(file);
        const fileData = { name: file.name, size: file.size, type: file.type, data: base64 };

        if (multiple) {
          const current = Array.isArray(value) ? value : [];
          handleChange([...current, fileData]);
        } else {
          handleChange(fileData);
        }
      } catch (err) {
        fileError = 'Failed to process file';
      } finally {
        isUploading = false;
        uploadProgress = 0;
      }
    }
  }

  // Remove uploaded file
  function removeFile(index?: number) {
    if (node.options?.multiple && typeof index === 'number') {
      const current = Array.isArray(value) ? value : [];
      handleChange(current.filter((_, i) => i !== index));
    } else {
      handleChange(null);
    }
  }


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

  // Context menu for edit mode fields
  let fieldContextMenu = $derived.by((): ContextMenuEntry[] => {
    if (mode !== 'edit' || node.readonly) return [];

    const items: ContextMenuEntry[] = [];

    // Clear value option (if field has a value)
    if (value != null && value !== '') {
      items.push({
        id: 'clear',
        label: 'Clear Value',
        icon: '✕',
        action: () => {
          handleChange(null);
        }
      });
    }

    return items;
  });
</script>

<div
  class="field-wrapper"
  class:required={node.required}
  use:contextMenu={{ items: fieldContextMenu, disabled: fieldContextMenu.length === 0 }}
>
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
      {:else if node.fieldType === 'radio' && node.options?.options}
        {@const selectedOption = node.options.options.find(o => o.value === value)}
        {selectedOption ? localeResolver.resolve(selectedOption.label) : value ?? '-'}
      {:else if node.fieldType === 'select' && node.options?.options}
        {localeResolver.resolve(node.options.options.find(o => o.value === value)?.label) || value}
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
      {:else if node.fieldType === 'multiselect'}
        <div class="multiselect-view">
          {#each (value as string[] ?? []) as selectedValue}
            {@const option = node.options?.options?.find(o => o.value === selectedValue)}
            {#if option}
              <span class="multiselect-badge">{localeResolver.resolve(option.label)}</span>
            {/if}
          {/each}
          {#if !(value as string[] ?? []).length}
            <span class="text-gray-400">None selected</span>
          {/if}
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
      {:else if node.fieldType === 'file'}
        <div class="file-view">
          {#if value}
            {#if node.options?.multiple && Array.isArray(value)}
              {#each value as file}
                <div class="file-item-view">
                  {#if node.options?.preview && file.type?.startsWith('image/')}
                    <img src={file.data} alt={file.name} class="file-preview-view" />
                  {:else}
                    <span>📄 {file.name}</span>
                  {/if}
                </div>
              {/each}
            {:else if value && typeof value === 'object'}
              {#if node.options?.preview && value.type?.startsWith('image/')}
                <img src={value.data} alt={value.name} class="file-preview-view" />
              {:else}
                <span>📄 {value.name}</span>
              {/if}
            {/if}
          {:else}
            <span class="no-file">No file uploaded</span>
          {/if}
        </div>
      {:else if node.fieldType === 'richtext'}
        <div class="richtext-view">{@html sanitizeHtml(String(value ?? ''))}</div>
      {:else if node.fieldType === 'code'}
        <CodeEditor
          value={String(value ?? '')}
          language={node.options?.language ?? 'javascript'}
          lineNumbers={node.options?.lineNumbers ?? true}
          theme={node.options?.theme ?? 'light'}
          readonly={true}
        />
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
    {:else if node.fieldType === 'radio'}
      <div
        class="radio-group"
        class:radio-horizontal={node.options?.layout === 'horizontal'}
        class:radio-vertical={!node.options?.layout || node.options?.layout === 'vertical'}
        role="radiogroup"
        aria-label={label ?? 'Radio group'}
        aria-required={node.required}
        aria-describedby={helpText ? `help-{node.id}` : undefined}
      >
        {#if node.options?.options}
          {#each node.options.options as option, i}
            <label class="radio-option">
              <input
                type="radio"
                name="radio-{node.id}"
                class="radio-input"
                value={option.value}
                checked={value === option.value}
                disabled={node.readonly}
                aria-checked={value === option.value}
                onchange={() => handleChange(option.value)}
              />
              <span class="radio-label">{localeResolver.resolve(option.label)}</span>
            </label>
          {/each}
        {/if}
      </div>
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
        {#if node.options?.options}
          {@const groupedOptions = node.options.options.reduce((acc, opt) => { const group = opt.group ?? ''; if (!acc[group]) acc[group] = []; acc[group].push(opt); return acc; }, {} as Record<string, typeof node.options.options>)}
          {#each Object.entries(groupedOptions) as [group, opts]}
            {#if group}
              <optgroup label={group}>
                {#each opts as option}
                  <option value={option.value}>{localeResolver.resolve(option.label)}</option>
                {/each}
              </optgroup>
            {:else}
              {#each opts as option}
                <option value={option.value}>{localeResolver.resolve(option.label)}</option>
              {/each}
            {/if}
          {/each}
        {/if}
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
    {:else if node.fieldType === 'multiselect'}
      <div class="multiselect-container">
        {#if (value as string[] ?? []).length > 0}
          <div class="multiselect-selected-chips">
            {#each (value as string[] ?? []) as selectedValue}
              {@const option = node.options?.options?.find(o => o.value === selectedValue)}
              {#if option}
                <span class="multiselect-chip">
                  {localeResolver.resolve(option.label)}
                  {#if !node.readonly}
                    <button
                      type="button"
                      class="multiselect-chip-remove"
                      onclick={() => {
                        const selected = [...(value as string[] ?? [])];
                        const index = selected.indexOf(selectedValue);
                        if (index > -1) {
                          selected.splice(index, 1);
                          handleChange(selected);
                        }
                      }}
                      aria-label="Remove {localeResolver.resolve(option.label)}"
                    >×</button>
                  {/if}
                </span>
              {/if}
            {/each}
          </div>
        {/if}
        {#if !node.readonly}
          <div class="multiselect-dropdown">
            {#if node.options?.searchable}
              <input
                type="text"
                class="multiselect-search field-input"
                placeholder={placeholder ?? 'Search...'}
                bind:value={searchQuery}
                aria-label="Search options"
              />
            {/if}
            <div class="multiselect-options" role="listbox" aria-multiselectable="true">
              {#if node.options?.options}
                {@const filteredOptions = node.options.searchable && searchQuery ? node.options.options.filter(opt => localeResolver.resolve(opt.label).toLowerCase().includes(searchQuery.toLowerCase())) : node.options.options}
                {@const groupedOptions = filteredOptions.reduce((acc, opt) => { const group = opt.group ?? ''; if (!acc[group]) acc[group] = []; acc[group].push(opt); return acc; }, {} as Record<string, typeof filteredOptions>)}
                {#each Object.entries(groupedOptions) as [group, opts]}
                  {#if group}<div class="multiselect-group-header">{group}</div>{/if}
                  {#each opts as option}
                    {@const isSelected = (value as string[] ?? []).includes(option.value)}
                    {@const isDisabled = !isSelected && node.options?.max && (value as string[] ?? []).length >= node.options.max}
                    <label class="multiselect-option" class:selected={isSelected} class:disabled={isDisabled} role="option" aria-selected={isSelected}>
                      <input type="checkbox" checked={isSelected} disabled={isDisabled} onchange={() => { const selected = [...(value as string[] ?? [])]; const index = selected.indexOf(option.value); if (index > -1) { selected.splice(index, 1); } else if (!isDisabled) { selected.push(option.value); } handleChange(selected); }} />
                      <span class="multiselect-option-label">{localeResolver.resolve(option.label)}</span>
                    </label>
                  {/each}
                {/each}
                {#if filteredOptions.length === 0}<div class="multiselect-no-options">No options found</div>{/if}
              {/if}
            </div>
          </div>
        {/if}
      </div>

      <input
        type="text"
        class="field-input"
        value={value ?? ''}
        readonly={node.readonly}
        placeholder={`Select ${node.options?.entityType ?? 'entity'}...`}
        oninput={(e) => handleChange(e.currentTarget.value)}
      />
    {:else if node.fieldType === 'richtext'}
      <RichTextEditorWrapper
        value={String(value ?? '')}
        readonly={node.readonly}
        placeholder={placeholder ?? 'Enter text...'}
        onChange={handleChange}
        ariaLabel={label ?? 'Rich text field'}
        ariaRequired={node.required}
        ariaDescribedby={helpText ? `help-${node.id}` : undefined}
      />
    {:else if node.fieldType === 'code'}
      <CodeEditor
        value={String(value ?? '')}
        language={node.options?.language ?? 'javascript'}
        lineNumbers={node.options?.lineNumbers ?? true}
        theme={node.options?.theme ?? 'light'}
        readonly={node.readonly ?? false}
        placeholder={placeholder}
        onChange={(newValue) => handleChange(newValue)}
      />
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
    {:else if node.fieldType === 'file'}
      <div class="file-upload-container">
        <!-- Dropzone -->
        <div
          class="file-upload-dropzone"
          class:dragover={false}
          role="button"
          tabindex="0"
          ondrop={handleDrop}
          ondragover={(e) => e.preventDefault()}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById(`file-${node.id}`)?.click(); }}
        >
          <input
            id="file-{node.id}"
            type="file"
            accept={node.options?.accept as string | undefined}
            multiple={node.options?.multiple}
            onchange={handleFileSelect}
            class="file-input-hidden"
          />
          <div class="file-upload-content">
            <span class="file-upload-icon">📁</span>
            <span class="file-upload-text">Drop files here or click to browse</span>
            {#if node.options?.accept}
              <span class="file-upload-hint">Accepted: {node.options.accept}</span>
            {/if}
            {#if node.options?.maxSize}
              <span class="file-upload-hint">Max size: {formatFileSize(node.options.maxSize as number)}</span>
            {/if}
          </div>
        </div>

        <!-- Progress -->
        {#if isUploading}
          <div class="file-upload-progress">
            <div class="progress-bar" style="width: {uploadProgress}%"></div>
          </div>
        {/if}

        <!-- Error -->
        {#if fileError}
          <div class="file-upload-error">{fileError}</div>
        {/if}

        <!-- File List -->
        {#if value}
          <div class="file-list">
            {#if node.options?.multiple && Array.isArray(value)}
              {#each value as file, i}
                <div class="file-item">
                  {#if node.options?.preview && file.type?.startsWith('image/')}
                    <img src={file.data} alt={file.name} class="file-preview" />
                  {/if}
                  <div class="file-info">
                    <span class="file-name">{file.name}</span>
                    <span class="file-size">{formatFileSize(file.size)}</span>
                  </div>
                  <button type="button" class="file-remove" onclick={() => removeFile(i)}>×</button>
                </div>
              {/each}
            {:else if value && typeof value === 'object'}
              <div class="file-item">
                {#if node.options?.preview && value.type?.startsWith('image/')}
                  <img src={value.data} alt={value.name} class="file-preview" />
                {/if}
                <div class="file-info">
                  <span class="file-name">{value.name}</span>
                  <span class="file-size">{formatFileSize(value.size)}</span>
                </div>
                <button type="button" class="file-remove" onclick={() => removeFile()}>×</button>
              </div>
            {/if}
          </div>
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

  /* Radio button field styles */
  .radio-group {
    display: flex;
    gap: 0.75rem;
  }

  .radio-horizontal {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .radio-vertical {
    flex-direction: column;
  }

  .radio-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .radio-input {
    width: 1rem;
    height: 1rem;
    cursor: pointer;
    margin: 0;
  }

  .radio-input:disabled {
    cursor: not-allowed;
  }

  .radio-label {
    cursor: pointer;
    user-select: none;
  }

  .radio-option:has(.radio-input:disabled) .radio-label {
    cursor: not-allowed;
    opacity: 0.6;
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
  .richtext-view {
    padding: 0.5rem 0;
  }

  /* Multiselect field styles */
  .multiselect-container { display: flex; flex-direction: column; gap: 0.5rem; }
  .multiselect-view { display: flex; flex-wrap: wrap; gap: 0.25rem; }
  .multiselect-selected-chips { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-bottom: 0.5rem; }
  .multiselect-chip, .multiselect-badge { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.5rem; background: var(--primary-color, #007bff); color: white; border-radius: 4px; font-size: 0.875rem; }
  .multiselect-chip-remove { background: none; border: none; color: white; cursor: pointer; padding: 0; font-size: 1rem; line-height: 1; margin-left: 0.25rem; }
  .multiselect-chip-remove:hover { color: #ff0000; }
  .multiselect-dropdown { border: 1px solid var(--border-color, #ccc); border-radius: 4px; overflow: hidden; }
  .multiselect-search { border: none; border-bottom: 1px solid var(--border-color, #ccc); border-radius: 0; }
  .multiselect-options { max-height: 300px; overflow-y: auto; padding: 0.25rem 0; }
  .multiselect-group-header { padding: 0.5rem 0.75rem; font-size: 0.75rem; font-weight: 600; color: var(--muted-color, #666); background: var(--bg-muted, #f5f5f5); text-transform: uppercase; letter-spacing: 0.5px; }
  .multiselect-option { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; cursor: pointer; transition: background 0.2s; }
  .multiselect-option:hover:not(.disabled) { background: var(--hover-bg, #f0f0f0); }
  .multiselect-option.selected { background: var(--selected-bg, #e7f3ff); }
  .multiselect-option.disabled { opacity: 0.5; cursor: not-allowed; }
  .multiselect-option input[type="checkbox"] { margin: 0; cursor: pointer; }
  .multiselect-option.disabled input[type="checkbox"] { cursor: not-allowed; }
  .multiselect-option-label { flex: 1; font-size: 0.875rem; }
  .multiselect-no-options { padding: 1rem; text-align: center; color: var(--muted-color, #666); font-size: 0.875rem; }

  /* File Upload Styles */
  .file-upload-container { width: 100%; }

  .file-upload-dropzone {
    border: 2px dashed var(--border-color, #444);
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
  }
  .file-upload-dropzone:hover, .file-upload-dropzone.dragover {
    border-color: var(--color-accent, #4a90e2);
    background: rgba(74, 144, 226, 0.1);
  }

  .file-input-hidden { display: none; }

  .file-upload-content { display: flex; flex-direction: column; gap: 0.5rem; align-items: center; }
  .file-upload-icon { font-size: 2rem; }
  .file-upload-text { font-weight: 500; }
  .file-upload-hint { font-size: 0.75rem; color: var(--color-text-secondary, #888); }

  .file-upload-progress { height: 4px; background: var(--color-bg-secondary, #2a2a2a); border-radius: 2px; margin-top: 0.5rem; overflow: hidden; }
  .progress-bar { height: 100%; background: var(--color-accent, #4a90e2); transition: width 0.2s; }

  .file-upload-error { color: var(--color-error, #e74c3c); font-size: 0.875rem; margin-top: 0.5rem; }

  .file-list { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
  .file-item {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.5rem; background: var(--color-bg-secondary, #2a2a2a);
    border-radius: 4px;
  }
  .file-preview { width: 48px; height: 48px; object-fit: cover; border-radius: 4px; }
  .file-info { flex: 1; display: flex; flex-direction: column; }
  .file-name { font-weight: 500; word-break: break-all; }
  .file-size { font-size: 0.75rem; color: var(--color-text-secondary, #888); }
  .file-remove {
    background: none; border: none; color: var(--color-error, #e74c3c);
    font-size: 1.25rem; cursor: pointer; padding: 0.25rem;
  }

  .file-view { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .file-item-view { padding: 0.25rem; }
  .file-preview-view { max-width: 150px; max-height: 150px; border-radius: 4px; }
  .no-file { color: var(--color-text-secondary, #888); font-style: italic; }
</style>
