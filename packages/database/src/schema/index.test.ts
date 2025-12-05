import { describe, it, expect } from 'vitest';
import * as schemaIndex from './index';

describe('schema/index module', () => {
  describe('exports', () => {
    it('should export users table', () => {
      expect(schemaIndex.users).toBeDefined();
    });

    it('should export sessions table', () => {
      expect(schemaIndex.sessions).toBeDefined();
    });

    it('should export campaigns table', () => {
      expect(schemaIndex.campaigns).toBeDefined();
    });

    it('should export scenes table', () => {
      expect(schemaIndex.scenes).toBeDefined();
    });

    it('should export tokens table', () => {
      expect(schemaIndex.tokens).toBeDefined();
    });

    it('should export walls table', () => {
      expect(schemaIndex.walls).toBeDefined();
    });

    it('should export ambientLights table', () => {
      expect(schemaIndex.ambientLights).toBeDefined();
    });

    it('should export actors table', () => {
      expect(schemaIndex.actors).toBeDefined();
    });

    it('should export items table', () => {
      expect(schemaIndex.items).toBeDefined();
    });

    it('should export combats table', () => {
      expect(schemaIndex.combats).toBeDefined();
    });

    it('should export combatants table', () => {
      expect(schemaIndex.combatants).toBeDefined();
    });

    it('should export chatMessages table', () => {
      expect(schemaIndex.chatMessages).toBeDefined();
    });
  });

  describe('export count', () => {
    it('should export all expected tables', () => {
      const expectedExports = [
        'users',
        'sessions',
        'campaigns',
        'scenes',
        'tokens',
        'walls',
        'ambientLights',
        'actors',
        'items',
        'combats',
        'combatants',
        'chatMessages',
      ];

      expectedExports.forEach(exportName => {
        expect(schemaIndex).toHaveProperty(exportName);
      });
    });
  });
});
