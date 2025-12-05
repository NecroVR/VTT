import { writable } from 'svelte/store';
import type { User, RegisterRequest, LoginRequest, AuthResponse } from '@vtt/shared';
import { API_BASE_URL } from '$lib/config/api';

const SESSION_STORAGE_KEY = 'vtt_session_id';

interface AuthState {
  user: User | null;
  sessionId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  sessionId: null,
  loading: false,
  error: null,
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,

    /**
     * Register a new user
     */
    async register(data: RegisterRequest): Promise<boolean> {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Registration failed');
        }

        const authResponse: AuthResponse = await response.json();

        // Store session ID
        localStorage.setItem(SESSION_STORAGE_KEY, authResponse.sessionId);

        update(state => ({
          ...state,
          user: authResponse.user,
          sessionId: authResponse.sessionId,
          loading: false,
          error: null,
        }));

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Registration failed';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        return false;
      }
    },

    /**
     * Login with email and password
     */
    async login(data: LoginRequest): Promise<boolean> {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Login failed');
        }

        const authResponse: AuthResponse = await response.json();

        // Store session ID
        localStorage.setItem(SESSION_STORAGE_KEY, authResponse.sessionId);

        update(state => ({
          ...state,
          user: authResponse.user,
          sessionId: authResponse.sessionId,
          loading: false,
          error: null,
        }));

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        return false;
      }
    },

    /**
     * Logout and clear session
     */
    async logout(): Promise<void> {
      const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);

      if (sessionId) {
        try {
          await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sessionId}`,
            },
          });
        } catch (error) {
          console.error('Logout error:', error);
        }
      }

      // Clear local storage and reset state
      localStorage.removeItem(SESSION_STORAGE_KEY);
      set(initialState);
    },

    /**
     * Check if user is authenticated and restore session
     */
    async checkSession(): Promise<boolean> {
      const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);

      if (!sessionId) {
        return false;
      }

      update(state => ({ ...state, loading: true }));

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionId}`,
          },
        });

        if (!response.ok) {
          // Session is invalid or expired
          localStorage.removeItem(SESSION_STORAGE_KEY);
          set(initialState);
          return false;
        }

        const data = await response.json();

        update(state => ({
          ...state,
          user: data.user,
          sessionId,
          loading: false,
          error: null,
        }));

        return true;
      } catch (error) {
        console.error('Session check error:', error);
        localStorage.removeItem(SESSION_STORAGE_KEY);
        set(initialState);
        return false;
      }
    },

    /**
     * Clear error message
     */
    clearError(): void {
      update(state => ({ ...state, error: null }));
    },
  };
}

export const authStore = createAuthStore();
