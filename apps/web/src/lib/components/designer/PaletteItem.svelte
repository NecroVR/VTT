<script lang="ts">
  import type { LayoutNode } from '@vtt/shared';

  // Props
  interface Props {
    type: string;
    label: string;
    icon: string;
    description: string;
    defaultNode: Partial<LayoutNode>;
  }

  let { type, label, icon, description, defaultNode }: Props = $props();

  // Generate unique ID for the node template
  function generateNodeId(): string {
    return crypto.randomUUID();
  }

  // Handle drag start
  function handleDragStart(event: DragEvent) {
    if (!event.dataTransfer) return;

    // Create the full node template with a unique ID
    const nodeTemplate = {
      ...defaultNode,
      id: generateNodeId()
    };

    // Set drag data
    event.dataTransfer.setData('application/vtt-component', JSON.stringify({
      type,
      template: nodeTemplate
    }));
    event.dataTransfer.effectAllowed = 'copy';

    // Add dragging class to the item
    const target = event.currentTarget as HTMLElement;
    target.classList.add('dragging');
  }

  // Handle drag end
  function handleDragEnd(event: DragEvent) {
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('dragging');
  }

  // Handle keyboard activation (Enter key)
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // TODO: Could dispatch a custom event for keyboard-based component insertion
      console.log('Component selected via keyboard:', type);
    }
  }
</script>

<div
  class="palette-item"
  draggable="true"
  role="button"
  tabindex="0"
  title={description}
  aria-label="{label} - {description}"
  aria-grabbed="false"
  ondragstart={handleDragStart}
  ondragend={handleDragEnd}
  onkeydown={handleKeyDown}
>
  <span class="palette-item-icon" aria-hidden="true">{icon}</span>
  <span class="palette-item-label">{label}</span>
</div>

<style>
  .palette-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--palette-item-bg, #f8f9fa);
    border: 1px solid var(--palette-item-border, #e0e0e0);
    border-radius: 4px;
    cursor: grab;
    transition: all 0.2s;
    user-select: none;
  }

  .palette-item:hover {
    background: var(--palette-item-hover-bg, #e9ecef);
    border-color: var(--palette-item-hover-border, #ced4da);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .palette-item:active {
    cursor: grabbing;
  }

  .palette-item.dragging {
    opacity: 0.5;
  }

  .palette-item:focus {
    outline: 2px solid var(--primary-color, #007bff);
    outline-offset: 2px;
  }

  .palette-item-icon {
    font-size: 1rem;
    color: var(--palette-icon-color, #6c757d);
    flex-shrink: 0;
  }

  .palette-item-label {
    font-size: 0.875rem;
    color: var(--palette-label-color, #495057);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
