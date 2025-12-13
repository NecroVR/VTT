<script lang="ts">
  import PaletteItem from './PaletteItem.svelte';
  import type { LayoutNode } from '@vtt/shared';

  // Local state
  let searchQuery = $state('');
  let expandedCategories = $state<Set<string>>(new Set(['layout', 'fields', 'dynamic', 'static']));

  // Component definitions organized by category
  interface ComponentDefinition {
    type: string;
    label: string;
    icon: string;
    description: string;
    defaultNode: Partial<LayoutNode>;
  }

  interface Category {
    id: string;
    name: string;
    components: ComponentDefinition[];
  }

  const categories: Category[] = [
    {
      id: 'layout',
      name: 'Layout',
      components: [
        {
          type: 'container',
          label: 'Container',
          icon: '📦',
          description: 'Generic container for grouping elements',
          defaultNode: {
            type: 'container',
            children: []
          }
        },
        {
          type: 'grid',
          label: 'Grid',
          icon: '⊞',
          description: 'CSS Grid layout with configurable columns and rows',
          defaultNode: {
            type: 'grid',
            columns: 2,
            gap: '1rem',
            children: []
          }
        },
        {
          type: 'flex',
          label: 'Flex',
          icon: '⬌',
          description: 'Flexbox layout with configurable direction and alignment',
          defaultNode: {
            type: 'flex',
            direction: 'row',
            gap: '1rem',
            children: []
          }
        },
        {
          type: 'columns',
          label: 'Columns',
          icon: '|||',
          description: 'Column layout with configurable widths',
          defaultNode: {
            type: 'columns',
            widths: ['1fr', '1fr'],
            gap: '1rem',
            children: []
          }
        },
        {
          type: 'tabs',
          label: 'Tabs',
          icon: '🗂',
          description: 'Tabbed interface for organizing content',
          defaultNode: {
            type: 'tabs',
            tabs: [
              {
                id: crypto.randomUUID(),
                label: 'Tab 1',
                children: []
              }
            ],
            position: 'top'
          }
        },
        {
          type: 'section',
          label: 'Section',
          icon: '▣',
          description: 'Collapsible section with optional title',
          defaultNode: {
            type: 'section',
            title: 'Section',
            collapsible: true,
            defaultCollapsed: false,
            children: []
          }
        },
        {
          type: 'group',
          label: 'Group',
          icon: '▢',
          description: 'Visual grouping with optional border and title',
          defaultNode: {
            type: 'group',
            title: 'Group',
            border: true,
            children: []
          }
        }
      ]
    },
    {
      id: 'fields',
      name: 'Fields',
      components: [
        {
          type: 'field-text',
          label: 'Text Field',
          icon: 'T',
          description: 'Single-line text input',
          defaultNode: {
            type: 'field',
            fieldType: 'text',
            binding: '',
            label: 'Text Field',
            required: false
          }
        },
        {
          type: 'field-number',
          label: 'Number Field',
          icon: '#',
          description: 'Numeric input field',
          defaultNode: {
            type: 'field',
            fieldType: 'number',
            binding: '',
            label: 'Number Field',
            required: false
          }
        },
        {
          type: 'field-checkbox',
          label: 'Checkbox',
          icon: '☑',
          description: 'Boolean checkbox field',
          defaultNode: {
            type: 'field',
            fieldType: 'checkbox',
            binding: '',
            label: 'Checkbox',
            required: false
          }
        },
        {
          type: 'field-select',
          label: 'Select',
          icon: '▼',
          description: 'Dropdown selection field',
          defaultNode: {
            type: 'field',
            fieldType: 'select',
            binding: '',
            label: 'Select',
            required: false,
            options: {
              options: [
                { value: 'option1', label: 'Option 1' },
                { value: 'option2', label: 'Option 2' }
              ]
            }
          }
        },
        {
          type: 'field-textarea',
          label: 'Textarea',
          icon: '⊞',
          description: 'Multi-line text input',
          defaultNode: {
            type: 'field',
            fieldType: 'textarea',
            binding: '',
            label: 'Textarea',
            required: false
          }
        },
        {
          type: 'computed',
          label: 'Computed Field',
          icon: 'ƒ',
          description: 'Display calculated value from other fields',
          defaultNode: {
            type: 'computed',
            fieldId: '',
            label: 'Computed Field',
            format: '{value}'
          }
        }
      ]
    },
    {
      id: 'dynamic',
      name: 'Dynamic',
      components: [
        {
          type: 'repeater',
          label: 'Repeater',
          icon: '↻',
          description: 'Repeat template for array data (e.g., inventory items)',
          defaultNode: {
            type: 'repeater',
            binding: '',
            itemTemplate: [],
            addLabel: 'Add Item',
            allowReorder: true,
            allowDelete: true
          }
        },
        {
          type: 'conditional',
          label: 'Conditional',
          icon: '?',
          description: 'Show/hide content based on conditions',
          defaultNode: {
            type: 'conditional',
            condition: {
              type: 'simple',
              field: '',
              operator: 'equals',
              value: ''
            },
            then: [],
            else: []
          }
        },
        {
          type: 'fragmentRef',
          label: 'Fragment Reference',
          icon: '🔗',
          description: 'Insert a reusable form fragment',
          defaultNode: {
            type: 'fragmentRef',
            fragmentId: '',
            parameters: {}
          }
        }
      ]
    },
    {
      id: 'static',
      name: 'Static Content',
      components: [
        {
          type: 'static-text',
          label: 'Static Text',
          icon: '📝',
          description: 'Static text, HTML, or markdown content',
          defaultNode: {
            type: 'static',
            content: 'Static content',
            contentType: 'text',
            tag: 'div'
          }
        },
        {
          type: 'image',
          label: 'Image',
          icon: '🖼',
          description: 'Display an image',
          defaultNode: {
            type: 'image',
            src: '',
            alt: '',
            objectFit: 'contain'
          }
        },
        {
          type: 'spacer',
          label: 'Spacer',
          icon: '↔',
          description: 'Add spacing between elements',
          defaultNode: {
            type: 'spacer',
            size: '1rem',
            orientation: 'horizontal'
          }
        },
        {
          type: 'divider',
          label: 'Divider',
          icon: '─',
          description: 'Visual divider line',
          defaultNode: {
            type: 'divider',
            orientation: 'horizontal'
          }
        }
      ]
    }
  ];

  // Filter components based on search query
  const filteredCategories = $derived(() => {
    if (!searchQuery.trim()) {
      return categories;
    }

    const query = searchQuery.toLowerCase();
    return categories.map(category => ({
      ...category,
      components: category.components.filter(
        comp =>
          comp.label.toLowerCase().includes(query) ||
          comp.description.toLowerCase().includes(query)
      )
    })).filter(category => category.components.length > 0);
  });

  // Toggle category expansion
  function toggleCategory(categoryId: string) {
    if (expandedCategories.has(categoryId)) {
      expandedCategories.delete(categoryId);
    } else {
      expandedCategories.add(categoryId);
    }
    expandedCategories = new Set(expandedCategories);
  }

  // Check if category is expanded
  function isCategoryExpanded(categoryId: string): boolean {
    return expandedCategories.has(categoryId);
  }
</script>

<div class="component-palette" role="region" aria-label="Component palette">
  <!-- Search Input -->
  <div class="palette-search">
    <label for="component-search" class="sr-only">Search components</label>
    <input
      id="component-search"
      type="search"
      placeholder="Search components..."
      bind:value={searchQuery}
      class="search-input"
      aria-label="Search components"
      aria-controls="palette-categories"
    />
  </div>

  <!-- Component Categories -->
  <div id="palette-categories" class="palette-categories" role="list" aria-label="Component categories">
    {#each filteredCategories() as category (category.id)}
      <div class="category" role="listitem">
        <button
          type="button"
          class="category-header"
          onclick={() => toggleCategory(category.id)}
          aria-expanded={isCategoryExpanded(category.id)}
          aria-controls="category-{category.id}"
          aria-label="Toggle {category.name} category"
        >
          <span class="category-icon" aria-hidden="true">
            {isCategoryExpanded(category.id) ? '▼' : '▶'}
          </span>
          <span class="category-name">{category.name}</span>
          <span class="category-count" aria-label="{category.components.length} components">
            {category.components.length}
          </span>
        </button>

        {#if isCategoryExpanded(category.id)}
          <div class="category-content" id="category-{category.id}" role="group" aria-label="{category.name} components">
            {#each category.components as component (component.type)}
              <PaletteItem
                type={component.type}
                label={component.label}
                icon={component.icon}
                description={component.description}
                defaultNode={component.defaultNode}
              />
            {/each}
          </div>
        {/if}
      </div>
    {/each}

    {#if filteredCategories().length === 0}
      <div class="no-results" role="status" aria-live="polite">
        <p>No components found</p>
        <p class="no-results-hint">Try a different search term</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .component-palette {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  /* Search */
  .palette-search {
    padding: 0.75rem;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    font-size: 0.875rem;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--primary-color, #007bff);
  }

  /* Categories */
  .palette-categories {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .category {
    border-bottom: 1px solid var(--border-color, #e0e0e0);
  }

  .category:last-child {
    border-bottom: none;
  }

  .category-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem;
    background: var(--category-header-bg, #f8f9fa);
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.2s;
  }

  .category-header:hover {
    background: var(--category-header-hover-bg, #e9ecef);
  }

  .category-icon {
    font-size: 0.75rem;
    color: var(--text-muted, #6c757d);
    flex-shrink: 0;
  }

  .category-name {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color, #212529);
  }

  .category-count {
    font-size: 0.75rem;
    color: var(--text-muted, #6c757d);
    background: var(--count-bg, #e9ecef);
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
  }

  .category-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
  }

  /* No Results */
  .no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    text-align: center;
    color: var(--text-muted, #6c757d);
  }

  .no-results p {
    margin: 0;
  }

  .no-results-hint {
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }

  /* Scrollbar styling */
  .palette-categories::-webkit-scrollbar {
    width: 6px;
  }

  .palette-categories::-webkit-scrollbar-track {
    background: var(--scrollbar-track, #f1f1f1);
  }

  .palette-categories::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb, #c1c1c1);
    border-radius: 3px;
  }

  .palette-categories::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover, #a8a8a8);
  }

  /* Screen reader only text */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Focus styles for accessibility */
  .search-input:focus-visible,
  .category-header:focus-visible {
    outline: 2px solid var(--primary-color, #007bff);
    outline-offset: 2px;
  }
</style>
