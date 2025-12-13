import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getForm, createForm } from '$lib/api/forms';
import type { FormDefinition } from '@vtt/shared';

export const load: PageLoad = async ({ params }) => {
  const { formId } = params;

  // Handle "new" as a special case for creating new forms
  if (formId === 'new') {
    // For new forms, we'll handle creation in the page component
    // Return a minimal form structure
    const newForm: Partial<FormDefinition> = {
      id: 'new',
      name: 'New Form',
      description: '',
      gameSystemId: '', // This should be passed via query params or set in the component
      entityType: '',
      version: 1,
      isDefault: false,
      isLocked: false,
      visibility: 'private',
      ownerId: '', // Will be set by the API
      layout: [],
      fragments: [],
      styles: {
        theme: 'default'
      },
      computedFields: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      form: newForm as FormDefinition,
      isNew: true
    };
  }

  // Load existing form
  try {
    const form = await getForm(formId);
    return {
      form,
      isNew: false
    };
  } catch (err) {
    console.error('Failed to load form:', err);
    throw error(404, {
      message: 'Form not found'
    });
  }
};
