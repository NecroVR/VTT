import type { LayoutNode, FormFieldType } from '@vtt/shared';

/**
 * Get display information for a tree node
 */
export function getTreeNodeInfo(node: LayoutNode): { icon: string; label: string } {
  switch (node.type) {
    case 'field':
      return {
        icon: getFieldIcon(node.fieldType),
        label: node.label || node.binding || 'Field'
      };
    case 'container':
      return { icon: '📦', label: 'Container' };
    case 'grid':
      return { icon: '⊞', label: `Grid (${node.columns} cols)` };
    case 'flex':
      return { icon: '↔️', label: `Flex (${node.direction})` };
    case 'columns':
      return { icon: '▦', label: `Columns (${node.widths.length})` };
    case 'tabs':
      return { icon: '📑', label: 'Tabs' };
    case 'section':
      return { icon: '📁', label: node.title || 'Section' };
    case 'group':
      return { icon: '▢', label: node.title || 'Group' };
    case 'repeater':
      return { icon: '🔁', label: `Repeater (${node.binding})` };
    case 'conditional':
      return { icon: '❓', label: 'Conditional' };
    case 'static':
      return { icon: '📝', label: `Static (${node.contentType || 'text'})` };
    case 'image':
      return { icon: '🖼️', label: 'Image' };
    case 'spacer':
      return { icon: '⬚', label: 'Spacer' };
    case 'divider':
      return { icon: '─', label: 'Divider' };
    case 'fragmentRef':
      return { icon: '🧩', label: `Fragment (${node.fragmentId})` };
    case 'computed':
      return { icon: '∑', label: node.label || `Computed (${node.fieldId})` };
    default:
      return { icon: '❔', label: 'Unknown' };
  }
}

/**
 * Get icon for a field type
 */
function getFieldIcon(fieldType: FormFieldType): string {
  const icons: Record<FormFieldType, string> = {
    text: '📝',
    number: '#️⃣',
    checkbox: '☑️',
    select: '📋',
    textarea: '📄',
    dice: '🎲',
    resource: '❤️',
    rating: '⭐',
    slider: '🎚️',
    tags: '🏷️',
    reference: '🔗',
    richtext: '📃',
    color: '🎨',
    image: '🖼️',
    date: '📅'
  };
  return icons[fieldType] || '📝';
}

/**
 * Get children nodes from any node type
 */
export function getNodeChildren(node: LayoutNode): LayoutNode[] {
  // Direct children array
  if ('children' in node && Array.isArray(node.children)) {
    return node.children;
  }

  // Tabs node - flatten all tabs' children
  if (node.type === 'tabs' && node.tabs) {
    return node.tabs.flatMap(tab => tab.children || []);
  }

  // Repeater node - item template
  if (node.type === 'repeater' && node.itemTemplate) {
    return node.itemTemplate;
  }

  // Conditional node - both branches
  if (node.type === 'conditional') {
    return [
      ...(node.then || []),
      ...(node.else || [])
    ];
  }

  return [];
}

/**
 * Check if a node has children
 */
export function hasChildren(node: LayoutNode): boolean {
  return getNodeChildren(node).length > 0;
}
