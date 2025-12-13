/**
 * Form Designer System Types
 *
 * Comprehensive type definitions for the dynamic form system that allows
 * customization of entity sheets (actors, items, etc.) with a visual designer.
 */

// ============================================================================
// Localization
// ============================================================================

/**
 * Localized string that can either be a literal value or a locale key
 * Falls back to literal if locale key is not found
 */
export interface LocalizedString {
  literal?: string;      // Direct text value
  localeKey?: string;    // Locale key for translation
}

// ============================================================================
// Field Types
// ============================================================================

/**
 * Available field types for form designer fields
 */
export type FormFieldType =
  | 'text'        // Single-line text input
  | 'number'      // Numeric input
  | 'checkbox'    // Boolean checkbox
  | 'select'      // Dropdown selection
  | 'textarea'    // Multi-line text
  | 'dice'        // Dice roller (e.g., "1d20+5")
  | 'resource'    // Resource bar (current/max)
  | 'rating'      // Star/dot rating
  | 'slider'      // Numeric slider
  | 'tags'        // Tag list input
  | 'reference'   // Reference to another entity
  | 'richtext'    // Rich text editor
  | 'color'       // Color picker
  | 'image'       // Image upload/URL
  | 'date';       // Date picker

/**
 * Type-specific options for form field configuration
 */
export interface FormFieldTypeOptions {
  // Select field options
  options?: { value: string; label: LocalizedString }[];

  // Numeric constraints (number, slider, rating)
  min?: number;
  max?: number;
  step?: number;

  // Text field options
  multiline?: boolean;
  placeholder?: LocalizedString;

  // Reference field options
  entityType?: string;      // 'actor', 'item', etc.
  allowCreate?: boolean;    // Allow creating new entity

  // Resource field options
  showMax?: boolean;        // Show max value input
  showBar?: boolean;        // Show visual progress bar
  barColor?: string;        // Color for progress bar

  // Image field options
  accept?: string;          // Accepted file types
  maxSize?: number;         // Max file size in bytes

  // Date field options
  includeTime?: boolean;    // Include time picker
  format?: string;          // Date format string

  // Tags field options
  suggestions?: string[];   // Tag suggestions
  allowCustom?: boolean;    // Allow custom tags

  // Rating field options
  iconStyle?: 'stars' | 'circles' | 'pips';  // Icon style for rating

  // Slider field options
  showValue?: boolean;      // Show current value label
  showTicks?: boolean;      // Show tick marks

  // Rich text field options
  showPreview?: boolean;    // Show markdown preview toggle

  // Color field options
  presets?: string[];       // Preset color palette (hex values)
}

// ============================================================================
// Visibility Conditions
// ============================================================================

/**
 * Operators for simple conditions
 */
export type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual';

/**
 * Simple condition comparing a field to a value
 */
export interface SimpleCondition {
  type: 'simple';
  field: string;              // Dot notation path to field (e.g., 'attributes.strength.value')
  operator: ConditionOperator;
  value?: unknown;            // Comparison value (not needed for isEmpty/isNotEmpty)
}

/**
 * Compound condition combining multiple conditions with AND/OR
 */
export interface CompoundCondition {
  type: 'compound';
  operator: 'and' | 'or';
  conditions: VisibilityCondition[];
}

/**
 * Union type for all visibility conditions
 */
export type VisibilityCondition = SimpleCondition | CompoundCondition;

// ============================================================================
// Layout Nodes - Building Blocks
// ============================================================================

/**
 * Base properties shared by all layout nodes
 */
export interface BaseLayoutNode {
  id: string;                           // Unique identifier for the node
  visibility?: VisibilityCondition;     // Optional visibility condition
  className?: string;                   // CSS class name(s)
  style?: Record<string, string>;       // Inline styles
}

/**
 * Field node - binds to entity data
 */
export interface FieldNode extends BaseLayoutNode {
  type: 'field';
  fieldType: FormFieldType;
  binding: string;                      // Dot notation path to entity property
  label?: LocalizedString;              // Display label
  helpText?: LocalizedString;           // Help text
  required?: boolean;                   // Whether field is required
  readonly?: boolean;                   // Whether field is read-only
  options?: FormFieldTypeOptions;       // Type-specific options
}

/**
 * Generic container node
 */
export interface ContainerNode extends BaseLayoutNode {
  type: 'container';
  children: LayoutNode[];
}

/**
 * CSS Grid layout node
 */
export interface GridNode extends BaseLayoutNode {
  type: 'grid';
  columns: number | string;             // Number or CSS grid-template-columns
  rows?: string;                        // CSS grid-template-rows
  gap?: string;                         // Grid gap (e.g., '1rem')
  columnGap?: string;                   // Column gap
  rowGap?: string;                      // Row gap
  children: LayoutNode[];
}

/**
 * Flexbox layout node
 */
export interface FlexNode extends BaseLayoutNode {
  type: 'flex';
  direction: 'row' | 'column';
  justify?: string;                     // justify-content value
  align?: string;                       // align-items value
  wrap?: boolean;                       // flex-wrap
  gap?: string;                         // Gap between items
  children: LayoutNode[];
}

/**
 * Column layout with configurable widths
 */
export interface ColumnsNode extends BaseLayoutNode {
  type: 'columns';
  widths: string[];                     // Width for each column (e.g., ['1fr', '2fr', '1fr'])
  gap?: string;                         // Gap between columns
  children: LayoutNode[];               // One child per column
}

/**
 * Tab definition for TabsNode
 */
export interface TabDefinition {
  id: string;
  label: LocalizedString;
  icon?: string;                        // Icon class or URL
  children: LayoutNode[];
}

/**
 * Tabbed layout node
 */
export interface TabsNode extends BaseLayoutNode {
  type: 'tabs';
  tabs: TabDefinition[];
  position?: 'top' | 'bottom' | 'left' | 'right';
  defaultTab?: string;                  // ID of default active tab
}

/**
 * Collapsible section node
 */
export interface SectionNode extends BaseLayoutNode {
  type: 'section';
  title?: LocalizedString;
  icon?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  children: LayoutNode[];
}

/**
 * Visual grouping node
 */
export interface GroupNode extends BaseLayoutNode {
  type: 'group';
  title?: LocalizedString;
  border?: boolean;                     // Show border
  children: LayoutNode[];
}

/**
 * Repeater node for array data (e.g., inventory items)
 */
export interface RepeaterNode extends BaseLayoutNode {
  type: 'repeater';
  binding: string;                      // Path to array property
  itemTemplate: LayoutNode[];           // Template for each item
  addLabel?: LocalizedString;           // Label for "Add" button
  emptyMessage?: LocalizedString;       // Message when empty
  minItems?: number;                    // Minimum number of items
  maxItems?: number;                    // Maximum number of items
  allowReorder?: boolean;               // Allow drag-and-drop reordering
  allowDelete?: boolean;                // Allow deleting items
}

/**
 * Conditional rendering node
 */
export interface ConditionalNode extends BaseLayoutNode {
  type: 'conditional';
  condition: VisibilityCondition;
  then: LayoutNode[];                   // Rendered if condition is true
  else?: LayoutNode[];                  // Rendered if condition is false
}

/**
 * Static content node (text, HTML, markdown, image, icon)
 */
export interface StaticNode extends BaseLayoutNode {
  type: 'static';
  content: LocalizedString;             // Content (may contain {{binding}} interpolation)
  contentType?: 'text' | 'html' | 'markdown' | 'image' | 'icon';
  tag?: string;                         // HTML tag to use (default 'div')
  alt?: string;                         // Alt text for images
  width?: string;                       // Width for images
  height?: string;                      // Height for images
  size?: string;                        // Size for icons
}

/**
 * Image display node
 */
export interface ImageNode extends BaseLayoutNode {
  type: 'image';
  src: string;                          // URL or {{binding}} interpolation
  alt?: LocalizedString;
  width?: string;
  height?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

/**
 * Spacer node for layout spacing
 */
export interface SpacerNode extends BaseLayoutNode {
  type: 'spacer';
  size?: string;                        // Size (e.g., '1rem', '20px')
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Visual divider node
 */
export interface DividerNode extends BaseLayoutNode {
  type: 'divider';
  orientation?: 'horizontal' | 'vertical';
  thickness?: string;
  color?: string;
}

/**
 * Fragment reference node - inserts a reusable fragment
 */
export interface FragmentRefNode extends BaseLayoutNode {
  type: 'fragmentRef';
  fragmentId: string;                   // ID of fragment to insert
  parameters?: Record<string, string>;  // Parameter name -> binding path or literal
}

/**
 * Computed field display node
 */
export interface ComputedNode extends BaseLayoutNode {
  type: 'computed';
  fieldId: string;                      // Reference to computed field definition
  label?: LocalizedString;
  format?: string;                      // Format string for display (e.g., '{value} HP')
}

/**
 * Field group node - standardizes label+input+help pattern
 */
export interface FieldGroupNode extends BaseLayoutNode {
  type: 'fieldGroup';
  layout?: 'stacked' | 'inline' | 'slim';  // default: 'stacked'
  label?: LocalizedString;
  helpText?: LocalizedString;
  required?: boolean;
  labelWidth?: string;                  // for inline layout, e.g., '120px' or '30%'
  children: LayoutNode[];               // Should contain field nodes
}

/**
 * Union of all layout node types
 */
export type LayoutNode =
  | FieldNode
  | ContainerNode
  | GridNode
  | FlexNode
  | ColumnsNode
  | TabsNode
  | SectionNode
  | GroupNode
  | RepeaterNode
  | ConditionalNode
  | StaticNode
  | ImageNode
  | SpacerNode
  | DividerNode
  | FragmentRefNode
  | ComputedNode
  | FieldGroupNode;

// ============================================================================
// Fragments - Reusable Layout Pieces
// ============================================================================

/**
 * Parameter definition for a form fragment
 */
export interface FragmentParameter {
  name: string;
  type: 'binding' | 'literal';          // Whether parameter is a data binding or literal value
  default?: string;                     // Default value if not provided
  description?: string;                 // Human-readable description
}

/**
 * Reusable form fragment definition
 */
export interface FormFragment {
  id: string;
  name: string;
  description?: string;
  parameters: FragmentParameter[];
  content: LayoutNode[];                // The fragment's layout
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Computed Fields
// ============================================================================

/**
 * Computed field definition for form designer - calculates values based on other fields
 */
export interface FormComputedField {
  id: string;
  name: string;
  description?: string;
  formula: string;                      // Expression to evaluate (e.g., '@strength + @dexterity')
  resultType: 'number' | 'string' | 'boolean';
  dependencies: string[];               // Paths to dependent fields
}

// ============================================================================
// Form Styles
// ============================================================================

/**
 * Form styling configuration
 */
export interface FormStyles {
  theme?: 'default' | 'dark' | 'light' | 'parchment' | 'custom';
  customCSS?: string;                   // Custom CSS rules
  variables?: Record<string, string>;   // CSS variable overrides (e.g., {'--primary-color': '#ff0000'})
}

// ============================================================================
// Main Form Definition
// ============================================================================

/**
 * Complete form definition for an entity type
 */
export interface FormDefinition {
  id: string;
  name: string;
  description?: string;
  gameSystemId: string;                 // Game system this form belongs to
  entityType: string;                   // 'actor', 'item', 'spell', etc.
  version: number;                      // Form version number
  isDefault: boolean;                   // Whether this is the default form for the entity type
  isLocked: boolean;                    // Whether form can be edited

  // Marketplace properties
  visibility: 'private' | 'campaign' | 'public' | 'marketplace';
  licenseType?: 'free' | 'paid' | 'subscription';
  price?: number;                       // Price in cents (for paid forms)
  ownerId: string;                      // User who created the form

  // Form content
  layout: LayoutNode[];                 // Root layout nodes
  fragments: FormFragment[];            // Reusable fragments
  styles: FormStyles;                   // Styling configuration
  computedFields: FormComputedField[];
  scripts?: string[];                   // Custom script paths (future feature)

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Form Licensing
// ============================================================================

/**
 * License grant for a user to use a form
 */
export interface FormLicense {
  id: string;
  formId: string;
  userId: string;
  licenseType: 'free' | 'paid' | 'subscription';
  grantedAt: Date;
  expiresAt?: Date | null;              // For subscriptions
  paymentId?: string | null;            // Reference to payment transaction
  subscriptionId?: string | null;       // Reference to subscription
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Campaign Form Assignments
// ============================================================================

/**
 * Assignment of a form to a campaign
 */
export interface CampaignForm {
  id: string;
  campaignId: string;
  formId: string;
  entityType: string;                   // Entity type this form applies to
  priority: number;                     // Priority when multiple forms exist (higher = preferred)
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Form Versioning
// ============================================================================

/**
 * Historical version of a form
 */
export interface FormVersion {
  id: string;
  formId: string;
  version: number;
  layout: LayoutNode[];
  fragments: FormFragment[];
  computedFields: FormComputedField[];
  styles: FormStyles;
  scripts?: string[];
  changeNotes?: string;
  createdBy?: string;
  createdAt: Date;
}

/**
 * Summary of a form version (without full layout data)
 */
export interface FormVersionSummary {
  id: string;
  formId: string;
  version: number;
  changeNotes?: string;
  createdBy?: string;
  createdAt: Date;
}

// ============================================================================
// API Request Types
// ============================================================================

/**
 * Request to create a new form
 */
export interface CreateFormRequest {
  name: string;
  description?: string;
  gameSystemId: string;
  entityType: string;
  layout?: LayoutNode[];
  fragments?: FormFragment[];
  styles?: FormStyles;
  computedFields?: FormComputedField[];
  visibility?: 'private' | 'campaign' | 'public';
}

/**
 * Request to update an existing form
 */
export interface UpdateFormRequest {
  name?: string;
  description?: string;
  layout?: LayoutNode[];
  fragments?: FormFragment[];
  styles?: FormStyles;
  computedFields?: FormComputedField[];
  visibility?: 'private' | 'campaign' | 'public' | 'marketplace';
  licenseType?: 'free' | 'paid' | 'subscription';
  price?: number;
  changeNotes?: string;  // Optional notes about this version change
}

/**
 * Request to duplicate a form
 */
export interface DuplicateFormRequest {
  name: string;
  description?: string;
}

/**
 * Request to assign a form to a campaign
 */
export interface AssignFormToCampaignRequest {
  formId: string;
  entityType: string;
  priority?: number;
}

/**
 * Request to update a campaign form assignment
 */
export interface UpdateCampaignFormRequest {
  priority?: number;
}

/**
 * Request to grant a form license
 */
export interface GrantFormLicenseRequest {
  userId: string;
  licenseType: 'free' | 'paid' | 'subscription';
  expiresAt?: Date;
  paymentId?: string;
  subscriptionId?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Single form response
 */
export interface FormResponse {
  form: FormDefinition;
}

/**
 * Multiple forms response
 */
export interface FormsListResponse {
  forms: FormDefinition[];
}

/**
 * Single form license response
 */
export interface FormLicenseResponse {
  license: FormLicense;
}

/**
 * Multiple form licenses response
 */
export interface FormLicensesListResponse {
  licenses: FormLicense[];
}

/**
 * Single campaign form response
 */
export interface CampaignFormResponse {
  campaignForm: CampaignForm;
}

/**
 * Multiple campaign forms response
 */
export interface CampaignFormsListResponse {
  campaignForms: CampaignForm[];
}

/**
 * Form validation response
 */
export interface FormValidationResponse {
  valid: boolean;
  errors?: Array<{
    nodeId: string;
    field: string;
    message: string;
  }>;
}

/**
 * Form preview data response
 */
export interface FormPreviewResponse {
  form: FormDefinition;
  sampleData: Record<string, unknown>;  // Sample entity data for preview
}

/**
 * Single form version response
 */
export interface FormVersionResponse {
  version: FormVersion;
}

/**
 * Multiple form versions response (summaries only)
 */
export interface FormVersionsListResponse {
  versions: FormVersionSummary[];
}

/**
 * Request to revert to a specific form version
 */
export interface RevertFormVersionRequest {
  changeNotes?: string;
}

// ============================================================================
// Form Import/Export
// ============================================================================

/**
 * Form export format - complete standalone form package
 */
export interface FormExport {
  exportVersion: string;  // "1.0"
  exportedAt: string;     // ISO timestamp
  form: {
    name: string;
    description?: string;
    entityType: string;
    gameSystemId?: string;
    version: number;
    layout: LayoutNode[];
    fragments: FormFragment[];
    computedFields: FormComputedField[];
    styles: FormStyles;
    scripts?: string[];
  };
  metadata: {
    exportedBy?: string;
    sourceUrl?: string;
    license?: string;
    notes?: string;
  };
}

/**
 * Form import validation result
 */
export interface FormImportValidation {
  valid: boolean;
  warnings: string[];
  errors: string[];
  conflicts: {
    nameConflict?: boolean;
    fragmentIdConflicts?: string[];
    gameSystemMismatch?: boolean;
    gameSystemId?: string;
    missingDependencies?: string[];
  };
}

/**
 * Request to import a form
 */
export interface ImportFormRequest {
  formData: FormExport;
  conflictResolution?: {
    nameConflict?: 'rename' | 'replace';  // How to handle duplicate names
    fragmentConflict?: 'regenerate' | 'keep';  // How to handle fragment ID conflicts
  };
}

/**
 * Form export response
 */
export interface FormExportResponse {
  export: FormExport;
}

/**
 * Form import response
 */
export interface FormImportResponse {
  form: FormDefinition;
  validation: FormImportValidation;
}
