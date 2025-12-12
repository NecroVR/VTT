import type { Database } from '@vtt/database';
import { forms } from '@vtt/database';
import type { LayoutNode, FormFragment, FormStyles, FormComputedField } from '@vtt/shared';
import { eq, and } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

/**
 * Form Loader Service
 *
 * Loads default form definitions from game system directories into the database.
 * Forms are loaded from {systemPath}/forms/ directory and saved as default forms
 * for their respective entity types.
 */

/**
 * Structure of a form file on disk
 */
export interface FormFile {
  name: string;
  description?: string;
  entityType: string;
  version?: string;
  layout: LayoutNode[];
  fragments?: FormFragment[];
  styles?: FormStyles;
  computedFields?: FormComputedField[];
}

/**
 * Result of loading forms from a game system
 */
export interface FormLoadResult {
  loaded: number;
  updated: number;
  errors: string[];
}

/**
 * Form validation result
 */
export interface FormValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Load forms from a game system's forms/ directory
 *
 * @param db - Database connection
 * @param systemId - Game system ID
 * @param systemPath - Absolute path to game system directory
 * @param systemOwnerId - User ID to use as owner for system forms
 * @returns Result with counts of loaded/updated forms and any errors
 */
export async function loadGameSystemForms(
  db: Database,
  systemId: string,
  systemPath: string,
  systemOwnerId: string
): Promise<FormLoadResult> {
  const formsDir = path.join(systemPath, 'forms');
  const result: FormLoadResult = {
    loaded: 0,
    updated: 0,
    errors: [],
  };

  try {
    // Check if forms directory exists
    try {
      await fs.access(formsDir);
    } catch {
      // forms/ directory doesn't exist - that's OK, not an error
      return result;
    }

    // Read all files in the forms directory
    const files = await fs.readdir(formsDir);
    const formFiles = files.filter((f) => f.endsWith('.form.json'));

    if (formFiles.length === 0) {
      return result;
    }

    console.log(`Loading ${formFiles.length} form file(s) for system '${systemId}'`);

    // Process each form file
    for (const file of formFiles) {
      try {
        const filePath = path.join(formsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const formData = JSON.parse(content) as FormFile;

        // Validate the form definition
        const validation = validateFormDefinition(formData);
        if (!validation.valid) {
          result.errors.push(`${file}: Validation failed - ${validation.errors.join(', ')}`);
          continue;
        }

        // Check if a default form already exists for this entity type
        const existingForms = await db
          .select()
          .from(forms)
          .where(
            and(
              eq(forms.gameSystemId, systemId),
              eq(forms.entityType, formData.entityType),
              eq(forms.isDefault, true)
            )
          )
          .limit(1);

        const version = formData.version || '1.0.0';

        if (existingForms.length > 0) {
          // Form exists - check if version changed
          const existingForm = existingForms[0];

          if (existingForm.version !== version) {
            // Update the existing form
            await db
              .update(forms)
              .set({
                name: formData.name,
                description: formData.description || null,
                version,
                layout: formData.layout,
                fragments: formData.fragments || [],
                styles: formData.styles || {},
                computedFields: formData.computedFields || [],
                updatedAt: new Date(),
              })
              .where(eq(forms.id, existingForm.id));

            result.updated++;
            console.log(`  Updated form: ${formData.name} (${formData.entityType}) - v${version}`);
          }
        } else {
          // Insert new default form
          await db.insert(forms).values({
            name: formData.name,
            description: formData.description || null,
            gameSystemId: systemId,
            entityType: formData.entityType,
            version,
            layout: formData.layout,
            fragments: formData.fragments || [],
            styles: formData.styles || {},
            computedFields: formData.computedFields || [],
            isDefault: true,
            isLocked: true, // Default forms are locked to prevent editing
            visibility: 'public',
            licenseType: 'free',
            ownerId: systemOwnerId,
          });

          result.loaded++;
          console.log(`  Loaded form: ${formData.name} (${formData.entityType}) - v${version}`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        result.errors.push(`${file}: ${errorMsg}`);
        console.error(`  Failed to load form from ${file}:`, errorMsg);
      }
    }

    console.log(
      `Forms for ${systemId}: ${result.loaded} loaded, ${result.updated} updated, ${result.errors.length} errors`
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    result.errors.push(`Failed to read forms directory: ${errorMsg}`);
    console.error(`Error loading forms from ${formsDir}:`, errorMsg);
  }

  return result;
}

/**
 * Validate a form definition
 *
 * @param form - Form file data to validate
 * @returns Validation result with success status and any errors
 */
export function validateFormDefinition(form: FormFile): FormValidationResult {
  const errors: string[] = [];

  // Check required fields
  if (!form.name || typeof form.name !== 'string') {
    errors.push('name is required and must be a string');
  }

  if (!form.entityType || typeof form.entityType !== 'string') {
    errors.push('entityType is required and must be a string');
  }

  if (!form.layout || !Array.isArray(form.layout)) {
    errors.push('layout is required and must be an array');
  }

  // Validate layout structure
  if (form.layout && Array.isArray(form.layout)) {
    validateLayoutNodes(form.layout, 'layout', errors);
  }

  // Validate fragments if present
  if (form.fragments && !Array.isArray(form.fragments)) {
    errors.push('fragments must be an array if provided');
  }

  // Validate computedFields if present
  if (form.computedFields && !Array.isArray(form.computedFields)) {
    errors.push('computedFields must be an array if provided');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Recursively validate layout nodes
 *
 * @param nodes - Array of layout nodes to validate
 * @param path - Current path for error reporting
 * @param errors - Array to collect validation errors
 */
function validateLayoutNodes(nodes: unknown[], path: string, errors: string[]): void {
  nodes.forEach((node, index) => {
    const nodePath = `${path}[${index}]`;

    if (!node || typeof node !== 'object') {
      errors.push(`${nodePath}: must be an object`);
      return;
    }

    const n = node as Record<string, unknown>;

    // Check required fields
    if (!n.id) {
      errors.push(`${nodePath}: missing required field 'id'`);
    }
    if (!n.type) {
      errors.push(`${nodePath}: missing required field 'type'`);
    }

    // Recursively validate child nodes based on node type
    if (n.children && Array.isArray(n.children)) {
      validateLayoutNodes(n.children, `${nodePath}.children`, errors);
    }

    if (n.tabs && Array.isArray(n.tabs)) {
      (n.tabs as unknown[]).forEach((tab, i) => {
        if (tab && typeof tab === 'object') {
          const tabObj = tab as Record<string, unknown>;
          if (tabObj.children && Array.isArray(tabObj.children)) {
            validateLayoutNodes(
              tabObj.children as unknown[],
              `${nodePath}.tabs[${i}].children`,
              errors
            );
          }
        }
      });
    }

    if (n.itemTemplate && Array.isArray(n.itemTemplate)) {
      validateLayoutNodes(n.itemTemplate, `${nodePath}.itemTemplate`, errors);
    }

    if (n.then && Array.isArray(n.then)) {
      validateLayoutNodes(n.then, `${nodePath}.then`, errors);
    }

    if (n.else && Array.isArray(n.else)) {
      validateLayoutNodes(n.else, `${nodePath}.else`, errors);
    }
  });
}

/**
 * Form Loader Service Class
 *
 * Provides methods for loading and managing forms from game system directories.
 */
export class FormLoaderService {
  /**
   * Load forms from a game system directory
   *
   * @param db - Database connection
   * @param systemId - Game system ID
   * @param systemPath - Absolute path to game system directory
   * @param systemOwnerId - User ID to use as owner for system forms
   * @returns Result with counts of loaded/updated forms and any errors
   */
  async loadSystemForms(
    db: Database,
    systemId: string,
    systemPath: string,
    systemOwnerId: string
  ): Promise<FormLoadResult> {
    return loadGameSystemForms(db, systemId, systemPath, systemOwnerId);
  }

  /**
   * Validate a form file
   *
   * @param formFilePath - Path to form file to validate
   * @returns Validation result
   */
  async validateFormFile(formFilePath: string): Promise<FormValidationResult> {
    try {
      const content = await fs.readFile(formFilePath, 'utf-8');
      const formData = JSON.parse(content) as FormFile;
      return validateFormDefinition(formData);
    } catch (err) {
      return {
        valid: false,
        errors: [err instanceof Error ? err.message : String(err)],
      };
    }
  }
}
