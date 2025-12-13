/**
 * Helper utilities for displaying node information in the canvas editor
 */

import type { LayoutNode } from '@vtt/shared';

export interface NodeDisplayInfo {
  label: string;
  icon: string;
  color: string;
  description?: string;
}

/**
 * Get display information for a layout node
 */
export function getNodeDisplayInfo(node: LayoutNode): NodeDisplayInfo {
  switch (node.type) {
    case 'field':
      return {
        label: node.label || node.binding || 'Field',
        icon: getFieldIcon(node.fieldType),
        color: '#e3f2fd',
        description: `${node.fieldType} field`
      };

    case 'container':
      return {
        label: 'Container',
        icon: '📦',
        color: '#f3e5f5',
        description: 'Generic container'
      };

    case 'grid':
      return {
        label: `Grid ${typeof node.columns === 'number' ? node.columns + '×' : ''}`,
        icon: '⊞',
        color: '#e8f5e9',
        description: 'Grid layout'
      };

    case 'flex':
      return {
        label: `Flex ${node.direction}`,
        icon: '⬌',
        color: '#fff3e0',
        description: 'Flexbox layout'
      };

    case 'columns':
      return {
        label: `Columns (${node.widths.length})`,
        icon: '▥',
        color: '#e0f2f1',
        description: 'Column layout'
      };

    case 'tabs':
      return {
        label: 'Tabs',
        icon: '📑',
        color: '#fce4ec',
        description: `${node.tabs.length} tabs`
      };

    case 'section':
      return {
        label: node.title || 'Section',
        icon: '📋',
        color: '#f1f8e9',
        description: node.collapsible ? 'Collapsible section' : 'Section'
      };

    case 'group':
      return {
        label: node.title || 'Group',
        icon: '▦',
        color: '#fff9c4',
        description: 'Visual group'
      };

    case 'repeater':
      return {
        label: `Repeater: ${node.binding}`,
        icon: '⟳',
        color: '#e1bee7',
        description: 'Repeating items'
      };

    case 'conditional':
      return {
        label: 'Conditional',
        icon: '⚡',
        color: '#ffecb3',
        description: 'If/then/else'
      };

    case 'static':
      return {
        label: getStaticLabel(node),
        icon: getStaticIcon(node.contentType),
        color: '#cfd8dc',
        description: `Static ${node.contentType || 'text'}`
      };

    case 'image':
      return {
        label: 'Image',
        icon: '🖼️',
        color: '#b2dfdb',
        description: 'Image display'
      };

    case 'spacer':
      return {
        label: 'Spacer',
        icon: '⇿',
        color: '#f5f5f5',
        description: node.orientation || 'vertical'
      };

    case 'divider':
      return {
        label: 'Divider',
        icon: '─',
        color: '#eeeeee',
        description: node.orientation || 'horizontal'
      };

    case 'fragmentRef':
      return {
        label: `Fragment: ${node.fragmentId}`,
        icon: '🧩',
        color: '#d1c4e9',
        description: 'Reusable fragment'
      };

    case 'computed':
      return {
        label: node.label || `Computed: ${node.fieldId}`,
        icon: '∑',
        color: '#c5e1a5',
        description: 'Computed field'
      };

    default:
      return {
        label: 'Unknown',
        icon: '❓',
        color: '#ffcdd2',
        description: 'Unknown node type'
      };
  }
}

/**
 * Get icon for field type
 */
function getFieldIcon(fieldType: string): string {
  const iconMap: Record<string, string> = {
    text: '📝',
    number: '🔢',
    checkbox: '☑️',
    select: '▼',
    textarea: '📄',
    dice: '🎲',
    resource: '❤️',
    rating: '⭐',
    slider: '━',
    tags: '🏷️',
    reference: '🔗',
    richtext: '📋',
    color: '🎨',
    image: '🖼️',
    date: '📅'
  };
  return iconMap[fieldType] || '📝';
}

/**
 * Get label for static content
 */
function getStaticLabel(node: { content: string; contentType?: string }): string {
  const maxLength = 30;
  let content = node.content || 'Static';

  if (content.length > maxLength) {
    content = content.substring(0, maxLength) + '...';
  }

  return content;
}

/**
 * Get icon for static content type
 */
function getStaticIcon(contentType?: string): string {
  const iconMap: Record<string, string> = {
    text: '📃',
    html: '🌐',
    markdown: '📝',
    image: '🖼️',
    icon: '⚡'
  };
  return iconMap[contentType || 'text'] || '📃';
}

/**
 * Check if a node can have children
 */
export function canHaveChildren(nodeType: string): boolean {
  return [
    'container',
    'grid',
    'flex',
    'columns',
    'section',
    'group'
  ].includes(nodeType);
}

/**
 * Check if a node type is a container/layout node
 */
export function isContainerNode(nodeType: string): boolean {
  return [
    'container',
    'grid',
    'flex',
    'columns',
    'tabs',
    'section',
    'group',
    'repeater',
    'conditional'
  ].includes(nodeType);
}

/**
 * Get children array from a node (handles different node types)
 */
export function getNodeChildren(node: LayoutNode): LayoutNode[] {
  if ('children' in node && Array.isArray(node.children)) {
    return node.children;
  }
  return [];
}
