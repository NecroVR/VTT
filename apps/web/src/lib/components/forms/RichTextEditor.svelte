<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  interface Props {
    value?: string;
    readonly?: boolean;
    placeholder?: string;
    onChange?: (html: string) => void;
    ariaLabel?: string;
    ariaRequired?: boolean;
    ariaDescribedby?: string;
  }

  let {
    value = '',
    readonly = false,
    placeholder = 'Enter text...',
    onChange,
    ariaLabel = 'Rich text editor',
    ariaRequired = false,
    ariaDescribedby
  }: Props = $props();

  let editor: any = null;
  let editorElement: HTMLDivElement;
  let isFocused = $state(false);

  // Track active formatting states
  let isActive = $derived.by(() => {
    if (!editor) return {};
    return {
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      heading1: editor.isActive('heading', { level: 1 }),
      heading2: editor.isActive('heading', { level: 2 }),
      heading3: editor.isActive('heading', { level: 3 }),
      bulletList: editor.isActive('bulletList'),
      orderedList: editor.isActive('orderedList'),
      link: editor.isActive('link')
    };
  });

  onMount(async () => {
    if (!browser || !editorElement) return;

    // Dynamically import Tiptap modules only in browser
    const [
      { Editor },
      { default: StarterKit },
      { default: Underline },
      { default: Link }
    ] = await Promise.all([
      import('@tiptap/core'),
      import('@tiptap/starter-kit'),
      import('@tiptap/extension-underline'),
      import('@tiptap/extension-link')
    ]);

    editor = new Editor({
      element: editorElement,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3]
          }
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'editor-link',
            rel: 'noopener noreferrer'
          }
        })
      ],
      content: value || '',
      editable: !readonly,
      editorProps: {
        attributes: {
          class: 'tiptap-content',
          'aria-label': ariaLabel,
          'aria-required': String(ariaRequired),
          'aria-describedby': ariaDescribedby
        }
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        onChange?.(html);
      },
      onFocus: () => {
        isFocused = true;
      },
      onBlur: () => {
        isFocused = false;
      }
    });

    // Update content when value prop changes
    $effect(() => {
      if (editor && value !== editor.getHTML()) {
        editor.commands.setContent(value || '');
      }
    });

    // Update editable state when readonly prop changes
    $effect(() => {
      if (editor) {
        editor.setEditable(!readonly);
      }
    });
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });

  // Toolbar action handlers
  function toggleBold() {
    editor?.chain().focus().toggleBold().run();
  }

  function toggleItalic() {
    editor?.chain().focus().toggleItalic().run();
  }

  function toggleUnderline() {
    editor?.chain().focus().toggleUnderline().run();
  }

  function setHeading(level: 1 | 2 | 3) {
    editor?.chain().focus().toggleHeading({ level }).run();
  }

  function toggleBulletList() {
    editor?.chain().focus().toggleBulletList().run();
  }

  function toggleOrderedList() {
    editor?.chain().focus().toggleOrderedList().run();
  }

  function setLink() {
    const previousUrl = editor?.getAttributes('link').href || '';
    const url = window.prompt('Enter URL:', previousUrl);

    // Cancelled
    if (url === null) return;

    // Empty string removes link
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // Update link
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  function clearFormatting() {
    editor?.chain().focus().clearNodes().unsetAllMarks().run();
  }
</script>

<div class="richtext-editor-wrapper" class:readonly class:focused={isFocused}>
  {#if !readonly}
    <div class="toolbar" role="toolbar" aria-label="Text formatting toolbar">
      <!-- Text formatting -->
      <div class="toolbar-group">
        <button
          type="button"
          class="toolbar-button"
          class:active={isActive.bold}
          onclick={toggleBold}
          title="Bold (Ctrl+B)"
          aria-label="Bold"
          aria-pressed={isActive.bold}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          class="toolbar-button"
          class:active={isActive.italic}
          onclick={toggleItalic}
          title="Italic (Ctrl+I)"
          aria-label="Italic"
          aria-pressed={isActive.italic}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          class="toolbar-button"
          class:active={isActive.underline}
          onclick={toggleUnderline}
          title="Underline (Ctrl+U)"
          aria-label="Underline"
          aria-pressed={isActive.underline}
        >
          <u>U</u>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Headings -->
      <div class="toolbar-group">
        <button
          type="button"
          class="toolbar-button"
          class:active={isActive.heading1}
          onclick={() => setHeading(1)}
          title="Heading 1"
          aria-label="Heading 1"
          aria-pressed={isActive.heading1}
        >
          H1
        </button>
        <button
          type="button"
          class="toolbar-button"
          class:active={isActive.heading2}
          onclick={() => setHeading(2)}
          title="Heading 2"
          aria-label="Heading 2"
          aria-pressed={isActive.heading2}
        >
          H2
        </button>
        <button
          type="button"
          class="toolbar-button"
          class:active={isActive.heading3}
          onclick={() => setHeading(3)}
          title="Heading 3"
          aria-label="Heading 3"
          aria-pressed={isActive.heading3}
        >
          H3
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Lists -->
      <div class="toolbar-group">
        <button
          type="button"
          class="toolbar-button"
          class:active={isActive.bulletList}
          onclick={toggleBulletList}
          title="Bullet list"
          aria-label="Bullet list"
          aria-pressed={isActive.bulletList}
        >
          •
        </button>
        <button
          type="button"
          class="toolbar-button"
          class:active={isActive.orderedList}
          onclick={toggleOrderedList}
          title="Numbered list"
          aria-label="Numbered list"
          aria-pressed={isActive.orderedList}
        >
          1.
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Link -->
      <div class="toolbar-group">
        <button
          type="button"
          class="toolbar-button"
          class:active={isActive.link}
          onclick={setLink}
          title="Insert/edit link"
          aria-label="Insert or edit link"
          aria-pressed={isActive.link}
        >
          🔗
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Clear formatting -->
      <div class="toolbar-group">
        <button
          type="button"
          class="toolbar-button"
          onclick={clearFormatting}
          title="Clear formatting"
          aria-label="Clear formatting"
        >
          ✕
        </button>
      </div>
    </div>
  {/if}

  <div class="editor-container" class:readonly>
    <div bind:this={editorElement} class="editor-mount"></div>
    {#if !value && !readonly}
      <div class="editor-placeholder">{placeholder}</div>
    {/if}
  </div>
</div>

<style>
  .richtext-editor-wrapper {
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
    background: var(--bg-color, white);
    transition: border-color 0.2s;
  }

  .richtext-editor-wrapper.focused:not(.readonly) {
    border-color: var(--primary-color, #007bff);
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  .richtext-editor-wrapper.readonly {
    background: var(--bg-muted, #f5f5f5);
    border-color: var(--border-muted, #e0e0e0);
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
    background: var(--bg-toolbar, #f9f9f9);
    flex-wrap: wrap;
  }

  .toolbar-group {
    display: flex;
    gap: 0.25rem;
  }

  .toolbar-divider {
    width: 1px;
    height: 24px;
    background: var(--border-color, #e0e0e0);
  }

  .toolbar-button {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 32px;
    padding: 0.25rem 0.5rem;
    border: 1px solid transparent;
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-color, #333);
    transition: all 0.2s;
  }

  .toolbar-button:hover {
    background: var(--hover-bg, #e8e8e8);
    border-color: var(--border-color, #ccc);
  }

  .toolbar-button.active {
    background: var(--primary-color, #007bff);
    color: white;
    border-color: var(--primary-color, #007bff);
  }

  .toolbar-button:focus-visible {
    outline: 2px solid var(--primary-color, #007bff);
    outline-offset: 2px;
  }

  .editor-container {
    position: relative;
    min-height: 150px;
  }

  .editor-container.readonly {
    padding: 0.75rem;
  }

  .editor-mount {
    min-height: 150px;
  }

  .editor-placeholder {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    color: var(--muted-color, #999);
    pointer-events: none;
    font-size: 1rem;
  }

  /* Tiptap content styles */
  :global(.tiptap-content) {
    padding: 0.75rem;
    outline: none;
    min-height: 150px;
  }

  :global(.tiptap-content p) {
    margin: 0 0 0.5rem 0;
  }

  :global(.tiptap-content p:last-child) {
    margin-bottom: 0;
  }

  :global(.tiptap-content h1) {
    font-size: 2rem;
    font-weight: 700;
    margin: 1rem 0 0.5rem 0;
    line-height: 1.2;
  }

  :global(.tiptap-content h2) {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0.875rem 0 0.5rem 0;
    line-height: 1.3;
  }

  :global(.tiptap-content h3) {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0.75rem 0 0.5rem 0;
    line-height: 1.4;
  }

  :global(.tiptap-content h1:first-child),
  :global(.tiptap-content h2:first-child),
  :global(.tiptap-content h3:first-child) {
    margin-top: 0;
  }

  :global(.tiptap-content ul),
  :global(.tiptap-content ol) {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  :global(.tiptap-content ul) {
    list-style-type: disc;
  }

  :global(.tiptap-content ol) {
    list-style-type: decimal;
  }

  :global(.tiptap-content li) {
    margin: 0.25rem 0;
  }

  :global(.tiptap-content strong) {
    font-weight: 700;
  }

  :global(.tiptap-content em) {
    font-style: italic;
  }

  :global(.tiptap-content u) {
    text-decoration: underline;
  }

  :global(.tiptap-content a.editor-link) {
    color: var(--primary-color, #007bff);
    text-decoration: underline;
    cursor: pointer;
  }

  :global(.tiptap-content a.editor-link:hover) {
    color: var(--primary-dark, #0056b3);
  }

  :global(.tiptap-content code) {
    background: var(--bg-muted, #f5f5f5);
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.875em;
  }

  :global(.tiptap-content pre) {
    background: var(--bg-muted, #f5f5f5);
    padding: 0.75rem;
    border-radius: 4px;
    overflow-x: auto;
    margin: 0.5rem 0;
  }

  :global(.tiptap-content pre code) {
    background: none;
    padding: 0;
  }

  :global(.tiptap-content blockquote) {
    border-left: 3px solid var(--border-color, #ccc);
    padding-left: 1rem;
    margin: 0.5rem 0;
    color: var(--muted-color, #666);
  }

  /* Focus styles for accessibility */
  :global(.tiptap-content:focus) {
    outline: none;
  }

  /* Ensure proper spacing in lists */
  :global(.tiptap-content ul ul),
  :global(.tiptap-content ol ol),
  :global(.tiptap-content ul ol),
  :global(.tiptap-content ol ul) {
    margin: 0.25rem 0;
  }
</style>
