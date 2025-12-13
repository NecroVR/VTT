import { writable, derived, type Readable } from 'svelte/store';
import type { FormDefinition, LayoutNode, UpdateFormRequest, FormFragment, FragmentParameter } from '@vtt/shared';
import * as formsApi from '$lib/api/forms';

// ============================================================================
// Store State Types
// ============================================================================

interface FormDesignerState {
  form: FormDefinition | null;
  selectedNodeId: string | null;
  clipboard: LayoutNode | null;
  undoStack: FormDefinition[];
  redoStack: FormDefinition[];
  isDirty: boolean;
  mode: 'design' | 'preview';
  saving: boolean;
  error: string | null;
  feedbackMessage: string | null;
  feedbackType: 'info' | 'success' | 'error' | null;
}

const initialState: FormDesignerState = {
  form: null,
  selectedNodeId: null,
  clipboard: null,
  undoStack: [],
  redoStack: [],
  isDirty: false,
  mode: 'design',
  saving: false,
  error: null,
  feedbackMessage: null,
  feedbackType: null
};

// ============================================================================
// Cross-Form Clipboard Support (localStorage)
// ============================================================================

const CLIPBOARD_STORAGE_KEY = 'vtt-form-designer-clipboard';

/**
 * Save clipboard to localStorage for cross-form copy/paste
 */
function saveClipboardToStorage(node: LayoutNode): void {
  try {
    localStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(node));
  } catch (err) {
    console.warn('Failed to save clipboard to localStorage:', err);
  }
}

/**
 * Load clipboard from localStorage
 */
function loadClipboardFromStorage(): LayoutNode | null {
  try {
    const stored = localStorage.getItem(CLIPBOARD_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as LayoutNode;
  } catch (err) {
    console.warn('Failed to load clipboard from localStorage:', err);
    return null;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique ID for a new node
 */
function generateNodeId(): string {
  return crypto.randomUUID();
}

/**
 * Deep clone a node and assign new IDs to all nodes in the tree
 */
function cloneNode(node: LayoutNode): LayoutNode {
  const newNode = { ...node, id: generateNodeId() };

  // Clone children arrays if they exist
  if ('children' in newNode && Array.isArray(newNode.children)) {
    newNode.children = newNode.children.map(child => cloneNode(child));
  }

  // Clone tabs if they exist (TabsNode)
  if ('tabs' in newNode && Array.isArray(newNode.tabs)) {
    newNode.tabs = newNode.tabs.map(tab => ({
      ...tab,
      id: generateNodeId(),
      children: tab.children.map(child => cloneNode(child))
    }));
  }

  // Clone itemTemplate if it exists (RepeaterNode)
  if ('itemTemplate' in newNode && Array.isArray(newNode.itemTemplate)) {
    newNode.itemTemplate = newNode.itemTemplate.map(child => cloneNode(child));
  }

  // Clone then/else branches if they exist (ConditionalNode)
  if ('then' in newNode && Array.isArray(newNode.then)) {
    newNode.then = newNode.then.map(child => cloneNode(child));
  }
  if ('else' in newNode && Array.isArray(newNode.else)) {
    newNode.else = newNode.else.map(child => cloneNode(child));
  }

  return newNode;
}

/**
 * Find a node in the layout tree by ID
 */
function findNodeInLayout(layout: LayoutNode[], nodeId: string): LayoutNode | null {
  for (const node of layout) {
    if (node.id === nodeId) {
      return node;
    }

    // Search in children arrays
    if ('children' in node && Array.isArray(node.children)) {
      const found = findNodeInLayout(node.children, nodeId);
      if (found) return found;
    }

    // Search in tabs (TabsNode)
    if ('tabs' in node && Array.isArray(node.tabs)) {
      for (const tab of node.tabs) {
        const found = findNodeInLayout(tab.children, nodeId);
        if (found) return found;
      }
    }

    // Search in itemTemplate (RepeaterNode)
    if ('itemTemplate' in node && Array.isArray(node.itemTemplate)) {
      const found = findNodeInLayout(node.itemTemplate, nodeId);
      if (found) return found;
    }

    // Search in then/else branches (ConditionalNode)
    if ('then' in node && Array.isArray(node.then)) {
      const found = findNodeInLayout(node.then, nodeId);
      if (found) return found;
    }
    if ('else' in node && Array.isArray(node.else)) {
      const found = findNodeInLayout(node.else, nodeId);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Find the parent node of a given node ID
 */
function findParentNode(layout: LayoutNode[], nodeId: string): { parent: LayoutNode; childrenKey: string } | null {
  for (const node of layout) {
    // Check direct children
    if ('children' in node && Array.isArray(node.children)) {
      if (node.children.some(child => child.id === nodeId)) {
        return { parent: node, childrenKey: 'children' };
      }
      // Recursively search in children
      const found = findParentNode(node.children, nodeId);
      if (found) return found;
    }

    // Check tabs (TabsNode)
    if ('tabs' in node && Array.isArray(node.tabs)) {
      for (let i = 0; i < node.tabs.length; i++) {
        const tab = node.tabs[i];
        if (tab.children.some(child => child.id === nodeId)) {
          return { parent: node, childrenKey: `tabs[${i}].children` };
        }
        // Recursively search in tab children
        const found = findParentNode(tab.children, nodeId);
        if (found) return found;
      }
    }

    // Check itemTemplate (RepeaterNode)
    if ('itemTemplate' in node && Array.isArray(node.itemTemplate)) {
      if (node.itemTemplate.some(child => child.id === nodeId)) {
        return { parent: node, childrenKey: 'itemTemplate' };
      }
      // Recursively search in itemTemplate
      const found = findParentNode(node.itemTemplate, nodeId);
      if (found) return found;
    }

    // Check then/else branches (ConditionalNode)
    if ('then' in node && Array.isArray(node.then)) {
      if (node.then.some(child => child.id === nodeId)) {
        return { parent: node, childrenKey: 'then' };
      }
      // Recursively search in then branch
      const found = findParentNode(node.then, nodeId);
      if (found) return found;
    }
    if ('else' in node && Array.isArray(node.else)) {
      if (node.else.some(child => child.id === nodeId)) {
        return { parent: node, childrenKey: 'else' };
      }
      // Recursively search in else branch
      const found = findParentNode(node.else, nodeId);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Remove a node from the layout tree by ID
 */
function removeNodeFromLayout(layout: LayoutNode[], nodeId: string): LayoutNode[] {
  return layout.filter(node => {
    if (node.id === nodeId) {
      return false;
    }

    // Recursively remove from children
    if ('children' in node && Array.isArray(node.children)) {
      node.children = removeNodeFromLayout(node.children, nodeId);
    }

    // Recursively remove from tabs
    if ('tabs' in node && Array.isArray(node.tabs)) {
      node.tabs = node.tabs.map(tab => ({
        ...tab,
        children: removeNodeFromLayout(tab.children, nodeId)
      }));
    }

    // Recursively remove from itemTemplate
    if ('itemTemplate' in node && Array.isArray(node.itemTemplate)) {
      node.itemTemplate = removeNodeFromLayout(node.itemTemplate, nodeId);
    }

    // Recursively remove from then/else branches
    if ('then' in node && Array.isArray(node.then)) {
      node.then = removeNodeFromLayout(node.then, nodeId);
    }
    if ('else' in node && Array.isArray(node.else)) {
      node.else = removeNodeFromLayout(node.else, nodeId);
    }

    return true;
  });
}

/**
 * Add a node to a specific parent at a given index
 */
function addNodeToLayout(
  layout: LayoutNode[],
  parentId: string,
  node: LayoutNode,
  index?: number
): LayoutNode[] {
  return layout.map(layoutNode => {
    if (layoutNode.id === parentId) {
      // Found the parent, add the node
      if ('children' in layoutNode && Array.isArray(layoutNode.children)) {
        const newChildren = [...layoutNode.children];
        if (index !== undefined && index >= 0 && index <= newChildren.length) {
          newChildren.splice(index, 0, node);
        } else {
          newChildren.push(node);
        }
        return { ...layoutNode, children: newChildren };
      }
    }

    // Recursively search in children
    if ('children' in layoutNode && Array.isArray(layoutNode.children)) {
      return {
        ...layoutNode,
        children: addNodeToLayout(layoutNode.children, parentId, node, index)
      };
    }

    // Recursively search in tabs
    if ('tabs' in layoutNode && Array.isArray(layoutNode.tabs)) {
      return {
        ...layoutNode,
        tabs: layoutNode.tabs.map(tab => ({
          ...tab,
          children: addNodeToLayout(tab.children, parentId, node, index)
        }))
      };
    }

    // Recursively search in itemTemplate
    if ('itemTemplate' in layoutNode && Array.isArray(layoutNode.itemTemplate)) {
      return {
        ...layoutNode,
        itemTemplate: addNodeToLayout(layoutNode.itemTemplate, parentId, node, index)
      };
    }

    // Recursively search in then/else branches
    if ('then' in layoutNode && Array.isArray(layoutNode.then)) {
      const newNode = { ...layoutNode };
      newNode.then = addNodeToLayout(layoutNode.then, parentId, node, index);
      return newNode;
    }

    return layoutNode;
  });
}

/**
 * Update a specific node in the layout tree
 */
function updateNodeInLayout(
  layout: LayoutNode[],
  nodeId: string,
  updates: Partial<LayoutNode>
): LayoutNode[] {
  return layout.map(node => {
    if (node.id === nodeId) {
      return { ...node, ...updates };
    }

    // Recursively update in children
    if ('children' in node && Array.isArray(node.children)) {
      return {
        ...node,
        children: updateNodeInLayout(node.children, nodeId, updates)
      };
    }

    // Recursively update in tabs
    if ('tabs' in node && Array.isArray(node.tabs)) {
      return {
        ...node,
        tabs: node.tabs.map(tab => ({
          ...tab,
          children: updateNodeInLayout(tab.children, nodeId, updates)
        }))
      };
    }

    // Recursively update in itemTemplate
    if ('itemTemplate' in node && Array.isArray(node.itemTemplate)) {
      return {
        ...node,
        itemTemplate: updateNodeInLayout(node.itemTemplate, nodeId, updates)
      };
    }

    // Recursively update in then/else branches
    if ('then' in node && Array.isArray(node.then)) {
      const newNode = { ...node };
      newNode.then = updateNodeInLayout(node.then, nodeId, updates);
      if ('else' in node && Array.isArray(node.else)) {
        newNode.else = updateNodeInLayout(node.else, nodeId, updates);
      }
      return newNode;
    }

    return node;
  });
}

// ============================================================================
// Create Store
// ============================================================================

function createFormDesignerStore() {
  const { subscribe, update, set } = writable<FormDesignerState>(initialState);

  /**
   * Add current form to undo stack (for undo/redo)
   */
  function pushToUndo(state: FormDesignerState): FormDesignerState {
    if (!state.form) return state;

    return {
      ...state,
      undoStack: [...state.undoStack, state.form],
      redoStack: [], // Clear redo stack on new action
      isDirty: true
    };
  }

  return {
    subscribe,

    /**
     * Initialize the designer with a form
     */
    initializeForm(form: FormDefinition) {
      set({
        ...initialState,
        form,
        undoStack: [],
        redoStack: [],
        isDirty: false
      });
    },

    /**
     * Select a node by ID
     */
    selectNode(nodeId: string | null) {
      update(state => ({ ...state, selectedNodeId: nodeId }));
    },

    /**
     * Update a node's properties
     */
    updateNode(nodeId: string, updates: Partial<LayoutNode>) {
      update(state => {
        if (!state.form) return state;

        const newState = pushToUndo(state);
        const newLayout = updateNodeInLayout(state.form.layout, nodeId, updates);

        return {
          ...newState,
          form: { ...state.form, layout: newLayout }
        };
      });
    },

    /**
     * Add a node to a parent at a specific index
     */
    addNode(parentId: string, node: LayoutNode, index?: number) {
      update(state => {
        if (!state.form) return state;

        const newState = pushToUndo(state);

        // If parentId is 'root', add to top-level layout
        if (parentId === 'root') {
          const newLayout = [...state.form.layout];
          if (index !== undefined && index >= 0 && index <= newLayout.length) {
            newLayout.splice(index, 0, node);
          } else {
            newLayout.push(node);
          }
          return {
            ...newState,
            form: { ...state.form, layout: newLayout }
          };
        }

        const newLayout = addNodeToLayout(state.form.layout, parentId, node, index);

        return {
          ...newState,
          form: { ...state.form, layout: newLayout },
          selectedNodeId: node.id // Auto-select the new node
        };
      });
    },

    /**
     * Remove a node by ID
     */
    removeNode(nodeId: string) {
      update(state => {
        if (!state.form) return state;

        const newState = pushToUndo(state);
        const newLayout = removeNodeFromLayout(state.form.layout, nodeId);

        return {
          ...newState,
          form: { ...state.form, layout: newLayout },
          selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId
        };
      });
    },

    /**
     * Move a node to a new parent at a new index
     */
    moveNode(nodeId: string, newParentId: string, newIndex: number) {
      update(state => {
        if (!state.form) return state;

        // Find the node to move
        const nodeToMove = findNodeInLayout(state.form.layout, nodeId);
        if (!nodeToMove) return state;

        const newState = pushToUndo(state);

        // Remove the node from its current location
        let newLayout = removeNodeFromLayout(state.form.layout, nodeId);

        // Add it to the new location
        if (newParentId === 'root') {
          newLayout.splice(newIndex, 0, nodeToMove);
        } else {
          newLayout = addNodeToLayout(newLayout, newParentId, nodeToMove, newIndex);
        }

        return {
          ...newState,
          form: { ...state.form, layout: newLayout }
        };
      });
    },

    /**
     * Copy a node to clipboard
     */
    copyNode(nodeId: string) {
      update(state => {
        if (!state.form) return state;

        const nodeToCopy = findNodeInLayout(state.form.layout, nodeId);
        if (!nodeToCopy) return state;

        const clonedNode = cloneNode(nodeToCopy);
        saveClipboardToStorage(clonedNode);

        return {
          ...state,
          clipboard: clonedNode,
          feedbackMessage: 'Node copied to clipboard',
          feedbackType: 'success'
        };
      });
    },

    /**
     * Cut a node to clipboard (copy + delete)
     */
    cutNode(nodeId: string) {
      update(state => {
        if (!state.form) return state;

        const nodeToCut = findNodeInLayout(state.form.layout, nodeId);
        if (!nodeToCut) return state;

        // Copy to clipboard
        const clonedNode = cloneNode(nodeToCut);
        saveClipboardToStorage(clonedNode);

        // Remove from layout
        const newState = pushToUndo(state);
        const newLayout = removeNodeFromLayout(state.form.layout, nodeId);

        return {
          ...newState,
          form: { ...state.form, layout: newLayout },
          clipboard: clonedNode,
          selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
          feedbackMessage: 'Node cut to clipboard',
          feedbackType: 'success'
        };
      });
    },

    /**
     * Paste the clipboard node to a parent
     */
    pasteNode(parentId: string) {
      update(state => {
        if (!state.form) return state;

        // Try to load from localStorage if clipboard is empty
        let clipboard = state.clipboard;
        if (!clipboard) {
          clipboard = loadClipboardFromStorage();
          if (!clipboard) {
            return {
              ...state,
              feedbackMessage: 'Clipboard is empty',
              feedbackType: 'error'
            };
          }
        }

        const newState = pushToUndo(state);
        const nodeToPaste = cloneNode(clipboard); // Clone again to allow multiple pastes

        let newLayout;
        if (parentId === 'root') {
          newLayout = [...state.form.layout, nodeToPaste];
        } else {
          newLayout = addNodeToLayout(state.form.layout, parentId, nodeToPaste);
        }

        return {
          ...newState,
          form: { ...state.form, layout: newLayout },
          clipboard, // Update clipboard in case it was loaded from storage
          selectedNodeId: nodeToPaste.id, // Auto-select the pasted node
          feedbackMessage: 'Node pasted',
          feedbackType: 'success'
        };
      });
    },

    /**
     * Undo the last change
     */
    undo() {
      update(state => {
        if (state.undoStack.length === 0) return state;

        const previousForm = state.undoStack[state.undoStack.length - 1];
        const newUndoStack = state.undoStack.slice(0, -1);

        return {
          ...state,
          form: previousForm,
          undoStack: newUndoStack,
          redoStack: state.form ? [...state.redoStack, state.form] : state.redoStack,
          isDirty: newUndoStack.length > 0
        };
      });
    },

    /**
     * Redo the last undone change
     */
    redo() {
      update(state => {
        if (state.redoStack.length === 0) return state;

        const nextForm = state.redoStack[state.redoStack.length - 1];
        const newRedoStack = state.redoStack.slice(0, -1);

        return {
          ...state,
          form: nextForm,
          undoStack: state.form ? [...state.undoStack, state.form] : state.undoStack,
          redoStack: newRedoStack,
          isDirty: true
        };
      });
    },

    /**
     * Save the form to the API
     */
    async save() {
      let currentForm: FormDefinition | null = null;
      const unsub = subscribe(s => { currentForm = s.form; });
      unsub();

      if (!currentForm) {
        throw new Error('No form to save');
      }

      update(state => ({ ...state, saving: true, error: null }));

      try {
        const updates: UpdateFormRequest = {
          name: currentForm.name,
          description: currentForm.description,
          layout: currentForm.layout,
          fragments: currentForm.fragments,
          styles: currentForm.styles,
          computedFields: currentForm.computedFields
        };

        const updatedForm = await formsApi.updateForm(currentForm.id, updates);

        update(state => ({
          ...state,
          form: updatedForm,
          isDirty: false,
          saving: false,
          undoStack: [], // Clear undo stack after successful save
          redoStack: []
        }));

        return updatedForm;
      } catch (err) {
        update(state => ({
          ...state,
          saving: false,
          error: err instanceof Error ? err.message : 'Failed to save form'
        }));
        throw err;
      }
    },

    /**
     * Set the designer mode (design or preview)
     */
    setMode(mode: 'design' | 'preview') {
      update(state => ({ ...state, mode }));
    },

    /**
     * Update the form name
     */
    updateFormName(name: string) {
      update(state => {
        if (!state.form) return state;
        return {
          ...state,
          form: { ...state.form, name },
          isDirty: true
        };
      });
    },

    /**
     * Update form styles
     */
    updateStyles(styles: FormDefinition['styles']) {
      update(state => {
        if (!state.form) return state;

        const newState = pushToUndo(state);

        return {
          ...newState,
          form: { ...state.form, styles },
          isDirty: true
        };
      });
    },

    /**
     * Update the entire form from JSON
     */
    updateFromJson(updatedForm: FormDefinition) {
      update(state => {
        if (!state.form) return state;

        const newState = pushToUndo(state);

        return {
          ...newState,
          form: updatedForm
        };
      });
    },

    /**
     * Get a node by ID (helper method)
     */
    getNodeById(nodeId: string): LayoutNode | null {
      let form: FormDefinition | null = null;
      const unsub = subscribe(s => { form = s.form; });
      unsub();

      if (!form) return null;
      return findNodeInLayout(form.layout, nodeId);
    },

    /**
     * Get the parent of a node (helper method)
     */
    getParentNode(nodeId: string): LayoutNode | null {
      let form: FormDefinition | null = null;
      const unsub = subscribe(s => { form = s.form; });
      unsub();

      if (!form) return null;

      const result = findParentNode(form.layout, nodeId);
      return result ? result.parent : null;
    },

    /**
     * Clear error
     */
    clearError() {
      update(state => ({ ...state, error: null }));
    },

    /**
     * Clear feedback message
     */
    clearFeedback() {
      update(state => ({
        ...state,
        feedbackMessage: null,
        feedbackType: null
      }));
    },

    /**
     * Reset to initial state
     */
    reset() {
      set(initialState);
    },

    // ========================================================================
    // Fragment CRUD Operations
    // ========================================================================

    /**
     * Create a new fragment
     */
    createFragment(fragment: Omit<FormFragment, 'id' | 'createdAt' | 'updatedAt'>) {
      update(state => {
        if (!state.form) return state;

        const newState = pushToUndo(state);

        const newFragment: FormFragment = {
          ...fragment,
          id: generateNodeId(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        return {
          ...newState,
          form: {
            ...state.form,
            fragments: [...state.form.fragments, newFragment]
          }
        };
      });
    },

    /**
     * Update an existing fragment
     */
    updateFragment(fragmentId: string, updates: Partial<Omit<FormFragment, 'id' | 'createdAt' | 'updatedAt'>>) {
      update(state => {
        if (!state.form) return state;

        const newState = pushToUndo(state);

        const fragments = state.form.fragments.map(frag => {
          if (frag.id === fragmentId) {
            return {
              ...frag,
              ...updates,
              updatedAt: new Date()
            };
          }
          return frag;
        });

        return {
          ...newState,
          form: {
            ...state.form,
            fragments
          }
        };
      });
    },

    /**
     * Delete a fragment
     */
    deleteFragment(fragmentId: string) {
      update(state => {
        if (!state.form) return state;

        const newState = pushToUndo(state);

        const fragments = state.form.fragments.filter(frag => frag.id !== fragmentId);

        return {
          ...newState,
          form: {
            ...state.form,
            fragments
          }
        };
      });
    },

    /**
     * Get a fragment by ID
     */
    getFragmentById(fragmentId: string): FormFragment | null {
      let form: FormDefinition | null = null;
      const unsub = subscribe(s => { form = s.form; });
      unsub();

      if (!form) return null;
      return form.fragments.find(frag => frag.id === fragmentId) || null;
    },

    /**
     * Check if a fragment is being used in the layout
     */
    isFragmentInUse(fragmentId: string): boolean {
      let form: FormDefinition | null = null;
      const unsub = subscribe(s => { form = s.form; });
      unsub();

      if (!form) return false;

      function checkNodes(nodes: LayoutNode[]): boolean {
        for (const node of nodes) {
          if (node.type === 'fragmentRef' && node.fragmentId === fragmentId) {
            return true;
          }

          // Check children
          if ('children' in node && Array.isArray(node.children)) {
            if (checkNodes(node.children)) return true;
          }

          // Check tabs
          if ('tabs' in node && Array.isArray(node.tabs)) {
            for (const tab of node.tabs) {
              if (checkNodes(tab.children)) return true;
            }
          }

          // Check itemTemplate
          if ('itemTemplate' in node && Array.isArray(node.itemTemplate)) {
            if (checkNodes(node.itemTemplate)) return true;
          }

          // Check then/else
          if ('then' in node && Array.isArray(node.then)) {
            if (checkNodes(node.then)) return true;
          }
          if ('else' in node && Array.isArray(node.else)) {
            if (checkNodes(node.else)) return true;
          }
        }
        return false;
      }

      return checkNodes(form.layout);
    },

    // ========================================================================
    // Keyboard Navigation Helpers
    // ========================================================================

    /**
     * Get all visible nodes in tree order (depth-first)
     */
    getVisibleNodes(expandedNodes: Set<string>): string[] {
      let form: FormDefinition | null = null;
      const unsub = subscribe(s => { form = s.form; });
      unsub();

      if (!form) return [];

      const visibleIds: string[] = [];

      function collectVisibleNodes(nodes: LayoutNode[], isVisible: boolean = true) {
        for (const node of nodes) {
          if (isVisible) {
            visibleIds.push(node.id);
          }

          const isExpanded = expandedNodes.has(node.id);
          const shouldShowChildren = isVisible && isExpanded;

          // Collect from children arrays
          if ('children' in node && Array.isArray(node.children)) {
            collectVisibleNodes(node.children, shouldShowChildren);
          }

          // Collect from tabs
          if ('tabs' in node && Array.isArray(node.tabs)) {
            for (const tab of node.tabs) {
              collectVisibleNodes(tab.children, shouldShowChildren);
            }
          }

          // Collect from itemTemplate
          if ('itemTemplate' in node && Array.isArray(node.itemTemplate)) {
            collectVisibleNodes(node.itemTemplate, shouldShowChildren);
          }

          // Collect from then/else branches
          if ('then' in node && Array.isArray(node.then)) {
            collectVisibleNodes(node.then, shouldShowChildren);
          }
          if ('else' in node && Array.isArray(node.else)) {
            collectVisibleNodes(node.else, shouldShowChildren);
          }
        }
      }

      collectVisibleNodes(form.layout, true);
      return visibleIds;
    },

    /**
     * Get the next visible node in tree order
     */
    getNextVisibleNode(currentNodeId: string, expandedNodes: Set<string>): string | null {
      const visibleNodes = this.getVisibleNodes(expandedNodes);
      const currentIndex = visibleNodes.indexOf(currentNodeId);

      if (currentIndex === -1 || currentIndex === visibleNodes.length - 1) {
        return null;
      }

      return visibleNodes[currentIndex + 1];
    },

    /**
     * Get the previous visible node in tree order
     */
    getPrevVisibleNode(currentNodeId: string, expandedNodes: Set<string>): string | null {
      const visibleNodes = this.getVisibleNodes(expandedNodes);
      const currentIndex = visibleNodes.indexOf(currentNodeId);

      if (currentIndex <= 0) {
        return null;
      }

      return visibleNodes[currentIndex - 1];
    },

    /**
     * Get the first root node ID
     */
    getFirstNode(): string | null {
      let form: FormDefinition | null = null;
      const unsub = subscribe(s => { form = s.form; });
      unsub();

      if (!form || form.layout.length === 0) return null;
      return form.layout[0].id;
    },

    /**
     * Get the last visible node considering expansion state
     */
    getLastVisibleNode(expandedNodes: Set<string>): string | null {
      const visibleNodes = this.getVisibleNodes(expandedNodes);
      if (visibleNodes.length === 0) return null;
      return visibleNodes[visibleNodes.length - 1];
    },

    /**
     * Get parent node ID
     */
    getParentNodeId(nodeId: string): string | null {
      let form: FormDefinition | null = null;
      const unsub = subscribe(s => { form = s.form; });
      unsub();

      if (!form) return null;

      const result = findParentNode(form.layout, nodeId);
      return result ? result.parent.id : null;
    },

    /**
     * Get first child ID of a node
     */
    getFirstChildId(nodeId: string): string | null {
      const node = this.getNodeById(nodeId);
      if (!node) return null;

      // Check children array
      if ('children' in node && Array.isArray(node.children) && node.children.length > 0) {
        return node.children[0].id;
      }

      // Check tabs
      if ('tabs' in node && Array.isArray(node.tabs) && node.tabs.length > 0) {
        const firstTab = node.tabs[0];
        if (firstTab.children.length > 0) {
          return firstTab.children[0].id;
        }
      }

      // Check itemTemplate
      if ('itemTemplate' in node && Array.isArray(node.itemTemplate) && node.itemTemplate.length > 0) {
        return node.itemTemplate[0].id;
      }

      // Check then branch
      if ('then' in node && Array.isArray(node.then) && node.then.length > 0) {
        return node.then[0].id;
      }

      // Check else branch
      if ('else' in node && Array.isArray(node.else) && node.else.length > 0) {
        return node.else[0].id;
      }

      return null;
    },

    /**
     * Check if node has children
     */
    hasChildren(nodeId: string): boolean {
      const node = this.getNodeById(nodeId);
      if (!node) return false;

      if ('children' in node && Array.isArray(node.children) && node.children.length > 0) {
        return true;
      }

      if ('tabs' in node && Array.isArray(node.tabs)) {
        return node.tabs.some(tab => tab.children.length > 0);
      }

      if ('itemTemplate' in node && Array.isArray(node.itemTemplate) && node.itemTemplate.length > 0) {
        return true;
      }

      if ('then' in node && Array.isArray(node.then) && node.then.length > 0) {
        return true;
      }

      if ('else' in node && Array.isArray(node.else) && node.else.length > 0) {
        return true;
      }

      return false;
    }
  };
}

// ============================================================================
// Export Store Instance
// ============================================================================

export const formDesignerStore = createFormDesignerStore();

// ============================================================================
// Derived Stores
// ============================================================================

/**
 * Get the currently selected node
 */
export const selectedNode = derived(formDesignerStore, ($store) => {
  if (!$store.form || !$store.selectedNodeId) return null;
  return findNodeInLayout($store.form.layout, $store.selectedNodeId);
});

/**
 * Can undo?
 */
export const canUndo = derived(formDesignerStore, ($store) => $store.undoStack.length > 0);

/**
 * Can redo?
 */
export const canRedo = derived(formDesignerStore, ($store) => $store.redoStack.length > 0);

/**
 * Has clipboard?
 */
export const hasClipboard = derived(formDesignerStore, ($store) => $store.clipboard !== null);

/**
 * Is saving?
 */
export const isSaving = derived(formDesignerStore, ($store) => $store.saving);

/**
 * Designer error
 */
export const designerError = derived(formDesignerStore, ($store) => $store.error);

/**
 * Feedback message
 */
export const designerFeedback = derived(formDesignerStore, ($store) => ({
  message: $store.feedbackMessage,
  type: $store.feedbackType
}));
