import { describe, it, expect } from 'vitest';
import * as lib from './index';

describe('lib/index exports', () => {
  it('should export websocket instance', () => {
    expect(lib.websocket).toBeDefined();
    expect(typeof lib.websocket).toBe('object');
  });

  it('should export all types', () => {
    // Type exports are available at compile time
    // We can't directly test types, but we can verify the module structure
    const exports = Object.keys(lib);
    expect(exports).toContain('websocket');
  });

  it('should have state property on websocket', () => {
    expect(lib.websocket.state).toBeDefined();
    expect(typeof lib.websocket.state.subscribe).toBe('function');
  });

  it('should have send method on websocket', () => {
    expect(typeof lib.websocket.send).toBe('function');
  });

  it('should have connect method on websocket', () => {
    expect(typeof lib.websocket.connect).toBe('function');
  });

  it('should have disconnect method on websocket', () => {
    expect(typeof lib.websocket.disconnect).toBe('function');
  });

  it('should have subscribe method on websocket for messages', () => {
    expect(typeof lib.websocket.subscribe).toBe('function');
  });

  it('should have on method for typed message handlers', () => {
    expect(typeof lib.websocket.on).toBe('function');
  });

  it('should allow subscribing to websocket state', () => {
    let stateValue: any;
    const unsubscribe = lib.websocket.state.subscribe((value) => {
      stateValue = value;
    });

    expect(stateValue).toBeDefined();
    expect(typeof stateValue).toBe('object');
    expect(stateValue).toHaveProperty('connected');
    expect(stateValue).toHaveProperty('reconnecting');
    expect(stateValue).toHaveProperty('error');
    expect(stateValue).toHaveProperty('currentRoom');
    expect(stateValue).toHaveProperty('players');
    unsubscribe();
  });

  it('should have correct initial state', () => {
    let stateValue: any;
    const unsubscribe = lib.websocket.state.subscribe((value) => {
      stateValue = value;
    });

    expect(stateValue.connected).toBe(false);
    expect(stateValue.reconnecting).toBe(false);
    expect(stateValue.error).toBe(null);
    expect(stateValue.currentRoom).toBe(null);
    expect(Array.isArray(stateValue.players)).toBe(true);
    expect(stateValue.players.length).toBe(0);
    unsubscribe();
  });
});
