import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { authStore } from './auth';
import type { User, RegisterRequest, LoginRequest, AuthResponse } from '@vtt/shared';

describe('auth store', () => {
  const mockUser: User = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    role: 'player',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockAuthResponse: AuthResponse = {
    user: mockUser,
    sessionId: 'session-abc-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    // Reset store to initial state
    authStore.logout();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = get(authStore);
      expect(state.user).toBeNull();
      expect(state.sessionId).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('register', () => {
    it('should register successfully and update state', async () => {
      const registerData: RegisterRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuthResponse,
      } as Response);

      const result = await authStore.register(registerData);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/auth/register',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerData),
        })
      );

      const state = get(authStore);
      expect(state.user).toEqual(mockUser);
      expect(state.sessionId).toBe('session-abc-123');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should store session ID in localStorage on successful registration', async () => {
      const registerData: RegisterRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuthResponse,
      } as Response);

      await authStore.register(registerData);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'vtt_session_id',
        'session-abc-123'
      );
    });

    it('should handle registration error from API', async () => {
      const registerData: RegisterRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Email already exists' }),
      } as Response);

      const result = await authStore.register(registerData);

      expect(result).toBe(false);
      const state = get(authStore);
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Email already exists');
    });

    it('should handle network error during registration', async () => {
      const registerData: RegisterRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const result = await authStore.register(registerData);

      expect(result).toBe(false);
      const state = get(authStore);
      expect(state.error).toBe('Network error');
      expect(state.loading).toBe(false);
    });

    it('should set loading state during registration', async () => {
      const registerData: RegisterRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      global.fetch = vi.fn().mockReturnValueOnce(promise);

      const registerPromise = authStore.register(registerData);

      // Check loading state is true during async operation
      const loadingState = get(authStore);
      expect(loadingState.loading).toBe(true);

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => mockAuthResponse,
      });

      await registerPromise;

      // Check loading state is false after completion
      const finalState = get(authStore);
      expect(finalState.loading).toBe(false);
    });
  });

  describe('login', () => {
    it('should login successfully and update state', async () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuthResponse,
      } as Response);

      const result = await authStore.login(loginData);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginData),
        })
      );

      const state = get(authStore);
      expect(state.user).toEqual(mockUser);
      expect(state.sessionId).toBe('session-abc-123');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should store session ID in localStorage on successful login', async () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuthResponse,
      } as Response);

      await authStore.login(loginData);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'vtt_session_id',
        'session-abc-123'
      );
    });

    it('should handle login error with invalid credentials', async () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' }),
      } as Response);

      const result = await authStore.login(loginData);

      expect(result).toBe(false);
      const state = get(authStore);
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });

    it('should handle network error during login', async () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Connection failed'));

      const result = await authStore.login(loginData);

      expect(result).toBe(false);
      const state = get(authStore);
      expect(state.error).toBe('Connection failed');
      expect(state.loading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should call logout API and clear state', async () => {
      // Setup authenticated state
      global.localStorage.getItem = vi.fn().mockReturnValue('session-abc-123');
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
      } as Response);

      await authStore.logout();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/auth/logout',
        expect.objectContaining({
          method: 'POST',
          headers: { Authorization: 'Bearer session-abc-123' },
        })
      );

      expect(localStorage.removeItem).toHaveBeenCalledWith('vtt_session_id');

      const state = get(authStore);
      expect(state.user).toBeNull();
      expect(state.sessionId).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should clear localStorage even if API call fails', async () => {
      global.localStorage.getItem = vi.fn().mockReturnValue('session-abc-123');
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await authStore.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('vtt_session_id');

      const state = get(authStore);
      expect(state.user).toBeNull();
      expect(state.sessionId).toBeNull();
    });

    it('should handle logout when no session exists', async () => {
      global.localStorage.getItem = vi.fn().mockReturnValue(null);

      await authStore.logout();

      expect(global.fetch).not.toHaveBeenCalled();
      expect(localStorage.removeItem).toHaveBeenCalledWith('vtt_session_id');

      const state = get(authStore);
      expect(state.user).toBeNull();
      expect(state.sessionId).toBeNull();
    });
  });

  describe('checkSession', () => {
    it('should restore session with valid session ID', async () => {
      global.localStorage.getItem = vi.fn().mockReturnValue('session-abc-123');
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      } as Response);

      const result = await authStore.checkSession();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/auth/me',
        expect.objectContaining({
          method: 'GET',
          headers: { Authorization: 'Bearer session-abc-123' },
        })
      );

      const state = get(authStore);
      expect(state.user).toEqual(mockUser);
      expect(state.sessionId).toBe('session-abc-123');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should return false when no session ID exists', async () => {
      global.localStorage.getItem = vi.fn().mockReturnValue(null);

      const result = await authStore.checkSession();

      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();

      const state = get(authStore);
      expect(state.user).toBeNull();
    });

    it('should handle invalid/expired session', async () => {
      global.localStorage.getItem = vi.fn().mockReturnValue('expired-session');
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
      } as Response);

      const result = await authStore.checkSession();

      expect(result).toBe(false);
      expect(localStorage.removeItem).toHaveBeenCalledWith('vtt_session_id');

      const state = get(authStore);
      expect(state.user).toBeNull();
      expect(state.sessionId).toBeNull();
    });

    it('should clear storage on session check error', async () => {
      global.localStorage.getItem = vi.fn().mockReturnValue('session-abc-123');
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const result = await authStore.checkSession();

      expect(result).toBe(false);
      expect(localStorage.removeItem).toHaveBeenCalledWith('vtt_session_id');

      const state = get(authStore);
      expect(state.user).toBeNull();
      expect(state.sessionId).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error message', async () => {
      // Create an error state
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Some error' }),
      } as Response);

      await authStore.login({ email: 'test@example.com', password: 'wrong' });

      let state = get(authStore);
      expect(state.error).toBe('Some error');

      // Clear error
      authStore.clearError();

      state = get(authStore);
      expect(state.error).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle error response without error field', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      const result = await authStore.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toBe(false);
      const state = get(authStore);
      expect(state.error).toBe('Login failed');
    });

    it('should handle non-Error exceptions', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce('string error');

      const result = await authStore.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toBe(false);
      const state = get(authStore);
      expect(state.error).toBe('Login failed');
    });
  });
});
