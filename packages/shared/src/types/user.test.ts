import { describe, it, expect } from 'vitest';
import type { User, Session, AuthResponse, LoginRequest, RegisterRequest } from './user';

describe('User Types', () => {
  describe('User', () => {
    it('should have correct structure for valid user', () => {
      const user: User = {
        id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        createdAt: new Date(),
      };

      expect(user.id).toBe('user123');
      expect(user.email).toBe('test@example.com');
      expect(user.username).toBe('testuser');
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should accept different id formats', () => {
      const user: User = {
        id: 'abc123xyz',
        email: 'user@test.com',
        username: 'user1',
        createdAt: new Date(),
      };

      expect(user.id).toBe('abc123xyz');
    });

    it('should handle various email formats', () => {
      const user: User = {
        id: '1',
        email: 'test+tag@subdomain.example.com',
        username: 'user',
        createdAt: new Date(),
      };

      expect(user.email).toBe('test+tag@subdomain.example.com');
    });

    it('should handle usernames with different characters', () => {
      const user: User = {
        id: '1',
        email: 'test@test.com',
        username: 'user_name-123',
        createdAt: new Date(),
      };

      expect(user.username).toBe('user_name-123');
    });
  });

  describe('Session', () => {
    it('should have correct structure for valid session', () => {
      const expiresAt = new Date(Date.now() + 86400000); // 24 hours from now
      const session: Session = {
        id: 'session123',
        userId: 'user123',
        expiresAt,
      };

      expect(session.id).toBe('session123');
      expect(session.userId).toBe('user123');
      expect(session.expiresAt).toBe(expiresAt);
      expect(session.expiresAt).toBeInstanceOf(Date);
    });

    it('should handle expired sessions', () => {
      const pastDate = new Date('2020-01-01');
      const session: Session = {
        id: 'expired',
        userId: 'user1',
        expiresAt: pastDate,
      };

      expect(session.expiresAt.getTime()).toBeLessThan(Date.now());
    });

    it('should handle future expiration dates', () => {
      const futureDate = new Date('2030-01-01');
      const session: Session = {
        id: 'future',
        userId: 'user1',
        expiresAt: futureDate,
      };

      expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('AuthResponse', () => {
    it('should have correct structure for valid auth response', () => {
      const authResponse: AuthResponse = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          username: 'testuser',
          createdAt: new Date(),
        },
        sessionId: 'session123',
      };

      expect(authResponse.user).toBeDefined();
      expect(authResponse.user.id).toBe('user123');
      expect(authResponse.sessionId).toBe('session123');
    });

    it('should contain valid user object', () => {
      const user: User = {
        id: 'abc',
        email: 'user@test.com',
        username: 'username',
        createdAt: new Date(),
      };

      const authResponse: AuthResponse = {
        user,
        sessionId: 'xyz',
      };

      expect(authResponse.user).toEqual(user);
    });
  });

  describe('LoginRequest', () => {
    it('should have correct structure for valid login request', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
      };

      expect(loginRequest.email).toBe('test@example.com');
      expect(loginRequest.password).toBe('SecurePassword123!');
    });

    it('should handle various password formats', () => {
      const loginRequest: LoginRequest = {
        email: 'user@test.com',
        password: 'p@ssw0rd!#$%^&*()',
      };

      expect(loginRequest.password).toContain('@');
      expect(loginRequest.password).toContain('!');
    });

    it('should handle email with uppercase letters', () => {
      const loginRequest: LoginRequest = {
        email: 'Test.User@Example.COM',
        password: 'password',
      };

      expect(loginRequest.email).toBe('Test.User@Example.COM');
    });
  });

  describe('RegisterRequest', () => {
    it('should have correct structure for valid register request', () => {
      const registerRequest: RegisterRequest = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'SecurePassword123!',
      };

      expect(registerRequest.email).toBe('newuser@example.com');
      expect(registerRequest.username).toBe('newuser');
      expect(registerRequest.password).toBe('SecurePassword123!');
    });

    it('should handle minimum valid username', () => {
      const registerRequest: RegisterRequest = {
        email: 'user@test.com',
        username: 'u',
        password: 'pass',
      };

      expect(registerRequest.username).toHaveLength(1);
    });

    it('should handle long usernames', () => {
      const longUsername = 'a'.repeat(50);
      const registerRequest: RegisterRequest = {
        email: 'user@test.com',
        username: longUsername,
        password: 'password',
      };

      expect(registerRequest.username).toHaveLength(50);
    });

    it('should accept special characters in username', () => {
      const registerRequest: RegisterRequest = {
        email: 'user@test.com',
        username: 'user_name-123',
        password: 'password',
      };

      expect(registerRequest.username).toBe('user_name-123');
    });
  });
});
