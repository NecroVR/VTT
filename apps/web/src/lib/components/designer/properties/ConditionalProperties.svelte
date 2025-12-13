<script lang="ts">
  import type { ConditionalNode, VisibilityCondition } from '@vtt/shared';
  import ConditionBuilder from '../ConditionBuilder.svelte';

  interface Props {
    node: ConditionalNode;
    onUpdate: (updates: Partial<ConditionalNode>) => void;
  }

  let { node, onUpdate }: Props = $props();

  function updateCondition(condition: VisibilityCondition) {
    onUpdate({ condition });
  }
</script>

<div class="conditional-properties">
  <div class="property-group">
    <div class="group-header">
      <h4>Condition</h4>
    </div>
    <div class="group-content">
      <ConditionBuilder condition={node.condition} onUpdate={updateCondition} />
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
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
  }

  label > span {
    font-weight: 500;
    color: var(--label-color, #495057);
  }

  input[type="text"],
  select {
    padding: 0.5rem;
    border: 1px solid var(--input-border, #ced4da);
    border-radius: 4px;
    font-size: 0.875rem;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: var(--primary-color, #007bff);
  }
</style>
