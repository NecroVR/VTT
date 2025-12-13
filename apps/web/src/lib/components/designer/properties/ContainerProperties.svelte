<script lang="ts">
  import type { ContainerNode } from '@vtt/shared';

  interface Props {
    node: ContainerNode;
    onUpdate: (updates: Partial<ContainerNode>) => void;
  }

  let { node, onUpdate }: Props = $props();
</script>

<div class="container-properties">
  <div class="property-group">
    <div class="group-header">
      <h4>Basic</h4>
    </div>
    <div class="group-content">
      <p class="info-text">
        Container is a basic wrapper with no specific layout properties.
        Use Grid or Flex for structured layouts.
      </p>
    </div>
  </div>
</div>

<style>
  .property-group {
    border-bottom: 1px solid var(--border-color, #ddd);
  }

  .group-header {
    padding: 0.75rem 1rem;
    background: var(--group-header-bg, #f8f9fa);
  }

  .group-header h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color, #212529);
  }

  .group-content {
    padding: 1rem;
  }

  .info-text {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-muted, #6c757d);
    line-height: 1.5;
  }
</style>
