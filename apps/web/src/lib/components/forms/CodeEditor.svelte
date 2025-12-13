<script lang="ts">
  import { onMount } from 'svelte';
  import { EditorView, keymap, lineNumbers as lineNumbersExtension } from '@codemirror/view';
  import { EditorState } from '@codemirror/state';
  import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
  import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
  import { javascript } from '@codemirror/lang-javascript';
  import { json } from '@codemirror/lang-json';
  import { html } from '@codemirror/lang-html';
  import { css } from '@codemirror/lang-css';
  import { markdown } from '@codemirror/lang-markdown';

  interface Props {
    value: string;
    language?: string;
    lineNumbers?: boolean;
    theme?: 'light' | 'dark';
    readonly?: boolean;
    onChange?: (value: string) => void;
    placeholder?: string;
  }

  let {
    value = $bindable(''),
    language = 'javascript',
    lineNumbers = true,
    theme = 'light',
    readonly = false,
    onChange,
    placeholder = ''
  }: Props = $props();

  let editorContainer: HTMLDivElement;
  let editorView: EditorView | null = null;

  // Get language extension based on language name
  function getLanguageExtension(lang: string) {
    const languageMap: Record<string, any> = {
      javascript: javascript(),
      js: javascript(),
      typescript: javascript({ typescript: true }),
      ts: javascript({ typescript: true }),
      jsx: javascript({ jsx: true }),
      tsx: javascript({ typescript: true, jsx: true }),
      json: json(),
      html: html(),
      css: css(),
      markdown: markdown(),
      md: markdown()
    };
    return languageMap[lang.toLowerCase()] || javascript();
  }

  // Initialize CodeMirror editor
  function initializeEditor() {
    if (!editorContainer) return;

    // Clean up existing editor if any
    if (editorView) {
      editorView.destroy();
    }

    const extensions = [
      history(),
      bracketMatching(),
      syntaxHighlighting(defaultHighlightStyle),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      getLanguageExtension(language),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !readonly) {
          const newValue = update.state.doc.toString();
          value = newValue;
          if (onChange) {
            onChange(newValue);
          }
        }
      }),
      EditorState.readOnly.of(readonly),
      EditorView.editable.of(!readonly)
    ];

    // Add line numbers if enabled
    if (lineNumbers) {
      extensions.push(lineNumbersExtension());
    }

    // Theme styling
    const themeExtension = EditorView.theme(
      {
        '&': {
          height: '100%',
          fontSize: '14px',
          backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
          color: theme === 'dark' ? '#d4d4d4' : '#000000'
        },
        '.cm-content': {
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          minHeight: '200px',
          caretColor: theme === 'dark' ? '#ffffff' : '#000000'
        },
        '.cm-gutters': {
          backgroundColor: theme === 'dark' ? '#252526' : '#f5f5f5',
          color: theme === 'dark' ? '#858585' : '#6e7781',
          border: 'none'
        },
        '.cm-activeLineGutter': {
          backgroundColor: theme === 'dark' ? '#2a2d2e' : '#e8e8e8'
        },
        '.cm-activeLine': {
          backgroundColor: theme === 'dark' ? '#2a2d2e' : '#f0f0f0'
        },
        '.cm-selectionBackground, ::selection': {
          backgroundColor: theme === 'dark' ? '#264f78' : '#add6ff'
        },
        '.cm-focused .cm-selectionBackground, .cm-focused ::selection': {
          backgroundColor: theme === 'dark' ? '#264f78' : '#add6ff'
        },
        '.cm-cursor': {
          borderLeftColor: theme === 'dark' ? '#ffffff' : '#000000'
        }
      },
      { dark: theme === 'dark' }
    );
    extensions.push(themeExtension);

    // Create editor state
    const state = EditorState.create({
      doc: value || '',
      extensions
    });

    // Create editor view
    editorView = new EditorView({
      state,
      parent: editorContainer
    });
  }

  // Update editor content when value changes externally
  $effect(() => {
    if (editorView && value !== editorView.state.doc.toString()) {
      const transaction = editorView.state.update({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: value || ''
        }
      });
      editorView.dispatch(transaction);
    }
  });

  // Reinitialize editor when language or theme changes
  $effect(() => {
    if (editorView) {
      initializeEditor();
    }
  });

  onMount(() => {
    initializeEditor();

    return () => {
      if (editorView) {
        editorView.destroy();
      }
    };
  });
</script>

<div class="code-editor-wrapper">
  <div class="code-editor-container" bind:this={editorContainer}></div>
  {#if placeholder && !value}
    <div class="code-editor-placeholder">{placeholder}</div>
  {/if}
</div>

<style>
  .code-editor-wrapper {
    position: relative;
    width: 100%;
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
    overflow: hidden;
    min-height: 200px;
  }

  .code-editor-container {
    width: 100%;
    height: 100%;
    min-height: 200px;
  }

  .code-editor-placeholder {
    position: absolute;
    top: 8px;
    left: 40px;
    color: var(--muted-color, #999);
    pointer-events: none;
    font-family: Consolas, Monaco, 'Courier New', monospace;
    font-size: 14px;
  }

  /* Override CodeMirror focus styles */
  :global(.cm-editor.cm-focused) {
    outline: none;
  }

  .code-editor-wrapper:focus-within {
    border-color: var(--primary-color, #007bff);
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
</style>
