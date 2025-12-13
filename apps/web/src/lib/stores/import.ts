import { writable } from 'svelte/store';
import type {
  ImportJob,
  ImportSource,
  ImportRequest,
  ImportSourceType,
  FoundryExportData,
} from '@vtt/shared';
import { browser } from '$app/environment';
import { API_BASE_URL } from '$lib/config/api';

interface ImportState {
  jobs: Map<string, ImportJob>;
  sources: Map<string, ImportSource>;
  currentJobId: string | null;
  loading: boolean;
  error: string | null;
}

function createImportStore() {
  const { subscribe, set, update } = writable<ImportState>({
    jobs: new Map(),
    sources: new Map(),
    currentJobId: null,
    loading: false,
    error: null,
  });

  // Helper to get auth token
  function getAuthToken(): string | null {
    if (!browser) return null;
    return localStorage.getItem('vtt_session_id') || sessionStorage.getItem('vtt_session_id');
  }

  // Helper for fetch with auth
  async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  let pollInterval: number | null = null;

  return {
    subscribe,

    /**
     * Upload a file and get preview
     */
    async uploadFile(file: File): Promise<{ preview: FoundryExportData; filename: string; size: number } | null> {
      if (!browser) return null;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const formData = new FormData();
        formData.append('file', file);

        const token = getAuthToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/import/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
        }

        const result = await response.json();

        update(state => ({ ...state, loading: false }));

        return {
          preview: result.data.preview,
          filename: result.data.filename,
          size: result.data.size,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        console.error('Error uploading file:', error);
        return null;
      }
    },

    /**
     * Start an import job
     */
    async startImport(request: ImportRequest): Promise<ImportJob | null> {
      if (!browser) return null;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await authFetch(`${API_BASE_URL}/api/v1/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Import failed: ${response.statusText}`);
        }

        const result = await response.json();
        const job = result.data;

        update(state => {
          const newJobs = new Map(state.jobs);
          newJobs.set(job.id, job);
          return {
            ...state,
            jobs: newJobs,
            currentJobId: job.id,
            loading: false,
          };
        });

        return job;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to start import';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        console.error('Error starting import:', error);
        return null;
      }
    },

    /**
     * Get job status
     */
    async getJobStatus(jobId: string): Promise<ImportJob | null> {
      if (!browser) return null;

      try {
        const response = await authFetch(`${API_BASE_URL}/api/v1/import/jobs/${jobId}`);

        if (!response.ok) {
          throw new Error(`Failed to get job status: ${response.statusText}`);
        }

        const result = await response.json();
        const job = result.data;

        update(state => {
          const newJobs = new Map(state.jobs);
          newJobs.set(job.id, job);
          return {
            ...state,
            jobs: newJobs,
          };
        });

        return job;
      } catch (error) {
        console.error('Error getting job status:', error);
        return null;
      }
    },

    /**
     * List all import jobs
     */
    async listJobs(sourceType?: ImportSourceType, limit: number = 20): Promise<void> {
      if (!browser) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const params = new URLSearchParams();
        if (sourceType) params.append('sourceType', sourceType);
        params.append('limit', limit.toString());

        const response = await authFetch(
          `${API_BASE_URL}/api/v1/import/jobs?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(`Failed to list jobs: ${response.statusText}`);
        }

        const result = await response.json();
        const jobs = new Map<string, ImportJob>();

        if (result.data && Array.isArray(result.data)) {
          result.data.forEach((job: ImportJob) => {
            jobs.set(job.id, job);
          });
        }

        update(state => ({
          ...state,
          jobs,
          loading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to list jobs';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        console.error('Error listing jobs:', error);
      }
    },

    /**
     * List import sources
     */
    async listSources(sourceType?: ImportSourceType): Promise<void> {
      if (!browser) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const params = new URLSearchParams();
        if (sourceType) params.append('sourceType', sourceType);

        const response = await authFetch(
          `${API_BASE_URL}/api/v1/import/sources?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error(`Failed to list sources: ${response.statusText}`);
        }

        const result = await response.json();
        const sources = new Map<string, ImportSource>();

        if (result.data && Array.isArray(result.data)) {
          result.data.forEach((source: ImportSource) => {
            sources.set(source.id, source);
          });
        }

        update(state => ({
          ...state,
          sources,
          loading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to list sources';
        update(state => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));
        console.error('Error listing sources:', error);
      }
    },

    /**
     * Delete an import source
     */
    async deleteSource(sourceId: string): Promise<boolean> {
      if (!browser) return false;

      try {
        const response = await authFetch(
          `${API_BASE_URL}/api/v1/import/sources/${sourceId}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to delete source: ${response.statusText}`);
        }

        update(state => {
          const newSources = new Map(state.sources);
          newSources.delete(sourceId);
          return {
            ...state,
            sources: newSources,
          };
        });

        return true;
      } catch (error) {
        console.error('Error deleting source:', error);
        update(state => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to delete source',
        }));
        return false;
      }
    },

    /**
     * Start polling a job for status updates
     */
    startPolling(jobId: string): void {
      if (!browser) return;

      // Clear any existing interval
      if (pollInterval !== null) {
        clearInterval(pollInterval);
      }

      // Poll immediately
      this.getJobStatus(jobId);

      // Then poll every 2 seconds
      pollInterval = window.setInterval(() => {
        this.getJobStatus(jobId).then(job => {
          // Stop polling if job is complete
          if (job && (job.status === 'completed' || job.status === 'failed' || job.status === 'partial')) {
            this.stopPolling();
          }
        });
      }, 2000);
    },

    /**
     * Stop polling
     */
    stopPolling(): void {
      if (pollInterval !== null) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    },

    /**
     * Clear all data
     */
    clear(): void {
      this.stopPolling();
      set({
        jobs: new Map(),
        sources: new Map(),
        currentJobId: null,
        loading: false,
        error: null,
      });
    },

    /**
     * Clear error
     */
    clearError(): void {
      update(state => ({ ...state, error: null }));
    },
  };
}

export const importStore = createImportStore();
