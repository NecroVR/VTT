import { API_BASE_URL } from '$lib/config/api';
import type {
  FormDefinition,
  FormResponse,
  FormsListResponse,
  CreateFormRequest,
  UpdateFormRequest,
  DuplicateFormRequest,
  CampaignForm,
  CampaignFormsListResponse,
  AssignFormToCampaignRequest,
  UpdateCampaignFormRequest
} from '@vtt/shared';

const BASE_URL = `${API_BASE_URL}/api/v1`;

/**
 * Get authentication headers
 */
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('vtt_session_id');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }
  return response.json();
}

// ============================================================================
// Form CRUD Operations
// ============================================================================

/**
 * List forms for a game system
 */
export async function listForms(
  systemId: string,
  entityType?: string
): Promise<FormDefinition[]> {
  const params = new URLSearchParams();
  if (entityType) params.append('entityType', entityType);

  const url = `${BASE_URL}/game-systems/${systemId}/forms${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url, {
    headers: getAuthHeaders()
  });

  const data = await handleResponse<FormsListResponse>(response);
  return data.forms;
}

/**
 * Get a single form by ID
 */
export async function getForm(formId: string): Promise<FormDefinition> {
  const response = await fetch(`${BASE_URL}/forms/${formId}`, {
    headers: getAuthHeaders()
  });

  const data = await handleResponse<FormResponse>(response);
  return data.form;
}

/**
 * Create a new form
 */
export async function createForm(
  systemId: string,
  form: CreateFormRequest
): Promise<FormDefinition> {
  const response = await fetch(`${BASE_URL}/game-systems/${systemId}/forms`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(form)
  });

  const data = await handleResponse<FormResponse>(response);
  return data.form;
}

/**
 * Update an existing form
 */
export async function updateForm(
  formId: string,
  updates: UpdateFormRequest
): Promise<FormDefinition> {
  const response = await fetch(`${BASE_URL}/forms/${formId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });

  const data = await handleResponse<FormResponse>(response);
  return data.form;
}

/**
 * Delete a form
 */
export async function deleteForm(formId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/forms/${formId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }
}

/**
 * Duplicate a form
 */
export async function duplicateForm(
  formId: string,
  request: DuplicateFormRequest
): Promise<FormDefinition> {
  const response = await fetch(`${BASE_URL}/forms/${formId}/duplicate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request)
  });

  const data = await handleResponse<FormResponse>(response);
  return data.form;
}

// ============================================================================
// Campaign Form Operations
// ============================================================================

/**
 * List forms assigned to a campaign
 */
export async function listCampaignForms(campaignId: string): Promise<CampaignForm[]> {
  const response = await fetch(`${BASE_URL}/campaigns/${campaignId}/forms`, {
    headers: getAuthHeaders()
  });

  const data = await handleResponse<CampaignFormsListResponse>(response);
  return data.campaignForms;
}

/**
 * Assign a form to a campaign
 */
export async function assignFormToCampaign(
  campaignId: string,
  request: AssignFormToCampaignRequest
): Promise<CampaignForm> {
  const response = await fetch(`${BASE_URL}/campaigns/${campaignId}/forms`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request)
  });

  const data = await handleResponse<{ campaignForm: CampaignForm }>(response);
  return data.campaignForm;
}

/**
 * Update a campaign form assignment
 */
export async function updateCampaignForm(
  campaignId: string,
  assignmentId: string,
  updates: UpdateCampaignFormRequest
): Promise<CampaignForm> {
  const response = await fetch(`${BASE_URL}/campaigns/${campaignId}/forms/${assignmentId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });

  const data = await handleResponse<{ campaignForm: CampaignForm }>(response);
  return data.campaignForm;
}

/**
 * Remove a form from a campaign
 */
export async function removeCampaignForm(
  campaignId: string,
  assignmentId: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/campaigns/${campaignId}/forms/${assignmentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }
}

/**
 * Get the active form for an entity type in a campaign
 */
export async function getActiveForm(
  campaignId: string,
  entityType: string
): Promise<FormDefinition | null> {
  const response = await fetch(
    `${BASE_URL}/campaigns/${campaignId}/forms/active/${entityType}`,
    { headers: getAuthHeaders() }
  );

  if (response.status === 404) {
    return null;
  }

  const data = await handleResponse<FormResponse>(response);
  return data.form;
}
