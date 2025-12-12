<script lang="ts">
  import { onMount } from 'svelte';
  import { marked } from 'marked';

  let htmlContent = '';
  let loading = true;
  let error: string | null = null;
  let activeSection: string | null = null;

  // Table of contents extracted from the document
  const tableOfContents = [
    { id: 'overview', title: 'Overview' },
    { id: 'basic-formatting', title: 'Basic Formatting' },
    { id: 'dice-notation', title: 'Dice Notation' },
    { id: 'variables-and-references', title: 'Variables and References' },
    { id: 'entity-links', title: 'Entity Links' },
    { id: 'tables', title: 'Tables' },
    { id: 'structured-blocks', title: 'Structured Blocks' },
    { id: 'interactive-elements', title: 'Interactive Elements' },
    { id: 'visibility-and-permissions', title: 'Visibility and Permissions' },
    { id: 'document-types', title: 'Document Types' },
    { id: 'styling-documents', title: 'Styling Documents' },
    { id: 'best-practices', title: 'Best Practices' },
    { id: 'quick-reference', title: 'Quick Reference' },
  ];

  // Convert heading text to slug for ID
  function slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/-+/g, '-')      // Remove consecutive hyphens
      .trim();
  }

  onMount(async () => {
    try {
      // Fetch the markdown file from the server
      const response = await fetch('/api/v1/docs/markup-reference');
      if (!response.ok) {
        throw new Error('Failed to load documentation');
      }
      const markdown = await response.text();

      // Create custom renderer to add IDs to headings
      const renderer = new marked.Renderer();
      renderer.heading = function({ text, depth }: { text: string; depth: number }) {
        const id = slugify(text);
        return `<h${depth} id="${id}">${text}</h${depth}>`;
      };

      // Configure marked for GitHub-flavored markdown with custom renderer
      marked.setOptions({
        gfm: true,
        breaks: false,
      });
      marked.use({ renderer });

      // Parse markdown to HTML
      htmlContent = await marked.parse(markdown);
      loading = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load documentation';
      loading = false;
    }
  });

  function scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      activeSection = sectionId;
    }
  }

  function handleScroll() {
    // Update active section based on scroll position
    const sections = tableOfContents.map(item => document.getElementById(item.id)).filter(Boolean);

    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100) {
          activeSection = section.id;
          break;
        }
      }
    }
  }
</script>

<svelte:head>
  <title>Documentation - VTT</title>
</svelte:head>

<svelte:window on:scroll={handleScroll} />

<div class="docs-container">
  <!-- Sidebar Navigation -->
  <aside class="docs-sidebar">
    <div class="sidebar-header">
      <a href="/campaigns" class="back-link">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Campaigns
      </a>
    </div>
    <nav class="docs-nav">
      <h3>Contents</h3>
      <ul>
        {#each tableOfContents as item}
          <li>
            <button
              class="nav-link"
              class:active={activeSection === item.id}
              on:click={() => scrollToSection(item.id)}
            >
              {item.title}
            </button>
          </li>
        {/each}
      </ul>
    </nav>
  </aside>

  <!-- Main Content -->
  <main class="docs-content">
    {#if loading}
      <div class="loading">
        <p>Loading documentation...</p>
      </div>
    {:else if error}
      <div class="error">
        <h2>Error Loading Documentation</h2>
        <p>{error}</p>
        <p>Please try refreshing the page.</p>
      </div>
    {:else}
      <article class="markdown-body">
        {@html htmlContent}
      </article>
    {/if}
  </main>
</div>

<style>
  .docs-container {
    display: flex;
    min-height: 100vh;
    background-color: var(--color-bg-primary);
  }

  .docs-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 260px;
    height: 100vh;
    background-color: var(--color-bg-secondary);
    border-right: 1px solid var(--color-border);
    overflow-y: auto;
    z-index: 10;
  }

  .sidebar-header {
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
  }

  .back-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: var(--font-size-sm);
    transition: color 0.2s;
  }

  .back-link:hover {
    color: var(--color-primary);
  }

  .docs-nav {
    padding: var(--spacing-lg);
  }

  .docs-nav h3 {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--spacing-md);
  }

  .docs-nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .docs-nav li {
    margin-bottom: var(--spacing-xs);
  }

  .nav-link {
    display: block;
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    background: none;
    border: none;
    border-radius: var(--border-radius-sm);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
  }

  .nav-link:hover {
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
  }

  .nav-link.active {
    background-color: var(--color-primary);
    color: white;
  }

  .docs-content {
    flex: 1;
    margin-left: 260px;
    padding: var(--spacing-xl) var(--spacing-2xl);
    max-width: 900px;
  }

  .loading,
  .error {
    text-align: center;
    padding: var(--spacing-2xl);
  }

  .error h2 {
    color: #f87171;
    margin-bottom: var(--spacing-md);
  }

  /* Markdown Styles */
  .markdown-body {
    color: var(--color-text-primary);
    line-height: 1.7;
  }

  .markdown-body :global(h1) {
    font-size: var(--font-size-3xl);
    font-weight: 700;
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-md);
    border-bottom: 2px solid var(--color-border);
  }

  .markdown-body :global(h2) {
    font-size: var(--font-size-2xl);
    font-weight: 600;
    margin-top: var(--spacing-2xl);
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-sm);
    border-bottom: 1px solid var(--color-border);
  }

  .markdown-body :global(h3) {
    font-size: var(--font-size-xl);
    font-weight: 600;
    margin-top: var(--spacing-xl);
    margin-bottom: var(--spacing-md);
  }

  .markdown-body :global(h4) {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin-top: var(--spacing-lg);
    margin-bottom: var(--spacing-sm);
  }

  .markdown-body :global(p) {
    margin-bottom: var(--spacing-md);
  }

  .markdown-body :global(ul),
  .markdown-body :global(ol) {
    margin-bottom: var(--spacing-md);
    padding-left: var(--spacing-xl);
  }

  .markdown-body :global(li) {
    margin-bottom: var(--spacing-xs);
  }

  .markdown-body :global(code) {
    background-color: var(--color-bg-secondary);
    padding: 0.125rem 0.375rem;
    border-radius: var(--border-radius-sm);
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 0.9em;
  }

  .markdown-body :global(pre) {
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    padding: var(--spacing-md);
    overflow-x: auto;
    margin-bottom: var(--spacing-md);
  }

  .markdown-body :global(pre code) {
    background: none;
    padding: 0;
    font-size: var(--font-size-sm);
  }

  .markdown-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: var(--spacing-lg);
  }

  .markdown-body :global(th),
  .markdown-body :global(td) {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    text-align: left;
  }

  .markdown-body :global(th) {
    background-color: var(--color-bg-secondary);
    font-weight: 600;
  }

  .markdown-body :global(tr:nth-child(even)) {
    background-color: var(--color-bg-secondary);
  }

  .markdown-body :global(blockquote) {
    border-left: 4px solid var(--color-primary);
    margin: var(--spacing-md) 0;
    padding: var(--spacing-sm) var(--spacing-lg);
    background-color: var(--color-bg-secondary);
    border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
  }

  .markdown-body :global(blockquote p) {
    margin: 0;
    font-style: italic;
    color: var(--color-text-secondary);
  }

  .markdown-body :global(hr) {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: var(--spacing-xl) 0;
  }

  .markdown-body :global(strong) {
    font-weight: 600;
  }

  .markdown-body :global(a) {
    color: var(--color-primary);
    text-decoration: none;
  }

  .markdown-body :global(a:hover) {
    text-decoration: underline;
  }

  /* Responsive */
  @media (max-width: 900px) {
    .docs-sidebar {
      width: 200px;
    }

    .docs-content {
      margin-left: 200px;
      padding: var(--spacing-lg);
    }
  }

  @media (max-width: 600px) {
    .docs-container {
      flex-direction: column;
    }

    .docs-sidebar {
      position: relative;
      width: 100%;
      height: auto;
      border-right: none;
      border-bottom: 1px solid var(--color-border);
    }

    .docs-content {
      margin-left: 0;
      padding: var(--spacing-md);
    }

    .docs-nav ul {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-xs);
    }

    .docs-nav li {
      margin: 0;
    }

    .nav-link {
      padding: var(--spacing-xs) var(--spacing-sm);
      font-size: var(--font-size-xs);
    }
  }
</style>
