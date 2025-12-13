/**
 * Context Menu Types
 */

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  danger?: boolean;
  action: () => void;
}

export interface ContextMenuDivider {
  type: 'divider';
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuDivider;
