import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { templatesStore } from './templates';
import type { MeasurementTemplate, RulerMeasurement } from '@vtt/shared';

describe('templates store', () => {
  const mockTemplate1: MeasurementTemplate = {
    id: 'template-1',
    sceneId: 'scene-1',
    templateType: 'circle',
    x: 10,
    y: 10,
    distance: 5,
    direction: null,
    angle: null,
    width: null,
    color: '#ff0000',
    fillAlpha: 0.3,
    borderColor: '#ff0000',
    hidden: false,
    ownerId: 'user-1',
    data: {},
    createdAt: new Date('2025-01-01'),
  };

  const mockTemplate2: MeasurementTemplate = {
    id: 'template-2',
    sceneId: 'scene-1',
    templateType: 'cone',
    x: 20,
    y: 20,
    distance: 10,
    direction: 90,
    angle: 53,
    width: null,
    color: '#00ff00',
    fillAlpha: 0.5,
    borderColor: null,
    hidden: false,
    ownerId: 'user-1',
    data: {},
    createdAt: new Date('2025-01-02'),
  };

  const mockTemplate3: MeasurementTemplate = {
    id: 'template-3',
    sceneId: 'scene-2',
    templateType: 'ray',
    x: 30,
    y: 30,
    distance: 15,
    direction: 180,
    angle: null,
    width: 2,
    color: '#0000ff',
    fillAlpha: 0.4,
    borderColor: '#0000ff',
    hidden: true,
    ownerId: 'user-2',
    data: {},
    createdAt: new Date('2025-01-03'),
  };

  const mockRuler: RulerMeasurement = {
    userId: 'user-1',
    sceneId: 'scene-1',
    waypoints: [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ],
    color: '#00ff00',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    // Reset store to initial state
    templatesStore.clear();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = get(templatesStore);
      expect(state.templates).toBeInstanceOf(Map);
      expect(state.templates.size).toBe(0);
      expect(state.activeRuler).toBeNull();
      expect(state.selectedTemplateId).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('addTemplate', () => {
    it('should add template to store', () => {
      templatesStore.addTemplate(mockTemplate1);

      const state = get(templatesStore);
      expect(state.templates.get('template-1')).toEqual(mockTemplate1);
      expect(state.templates.size).toBe(1);
    });

    it('should add multiple templates', () => {
      templatesStore.addTemplate(mockTemplate1);
      templatesStore.addTemplate(mockTemplate2);

      const state = get(templatesStore);
      expect(state.templates.size).toBe(2);
      expect(state.templates.get('template-1')).toEqual(mockTemplate1);
      expect(state.templates.get('template-2')).toEqual(mockTemplate2);
    });

    it('should overwrite existing template with same ID', () => {
      templatesStore.addTemplate(mockTemplate1);

      const updatedTemplate = { ...mockTemplate1, distance: 10 };
      templatesStore.addTemplate(updatedTemplate);

      const state = get(templatesStore);
      expect(state.templates.size).toBe(1);
      expect(state.templates.get('template-1')?.distance).toBe(10);
    });
  });

  describe('updateTemplateLocal', () => {
    it('should update template with partial data', () => {
      templatesStore.addTemplate(mockTemplate1);

      templatesStore.updateTemplateLocal('template-1', { distance: 8, color: '#00ff00' });

      const state = get(templatesStore);
      const template = state.templates.get('template-1');
      expect(template?.distance).toBe(8);
      expect(template?.color).toBe('#00ff00');
      expect(template?.x).toBe(10); // Other properties unchanged
      expect(template?.y).toBe(10);
    });

    it('should handle updating non-existent template', () => {
      templatesStore.addTemplate(mockTemplate1);

      templatesStore.updateTemplateLocal('nonexistent', { distance: 999 });

      const state = get(templatesStore);
      expect(state.templates.size).toBe(1);
      expect(state.templates.get('nonexistent')).toBeUndefined();
    });

    it('should update template properties', () => {
      templatesStore.addTemplate(mockTemplate1);

      templatesStore.updateTemplateLocal('template-1', {
        hidden: true,
        fillAlpha: 0.8,
      });

      const state = get(templatesStore);
      const template = state.templates.get('template-1');
      expect(template?.hidden).toBe(true);
      expect(template?.fillAlpha).toBe(0.8);
    });
  });

  describe('removeTemplate', () => {
    it('should remove template from store', () => {
      templatesStore.addTemplate(mockTemplate1);
      templatesStore.addTemplate(mockTemplate2);

      templatesStore.removeTemplate('template-1');

      const state = get(templatesStore);
      expect(state.templates.size).toBe(1);
      expect(state.templates.get('template-1')).toBeUndefined();
      expect(state.templates.get('template-2')).toEqual(mockTemplate2);
    });

    it('should clear selectedTemplateId when selected template is removed', () => {
      templatesStore.addTemplate(mockTemplate1);
      templatesStore.selectTemplate('template-1');

      templatesStore.removeTemplate('template-1');

      const state = get(templatesStore);
      expect(state.selectedTemplateId).toBeNull();
    });

    it('should not change selectedTemplateId when different template removed', () => {
      templatesStore.addTemplate(mockTemplate1);
      templatesStore.addTemplate(mockTemplate2);
      templatesStore.selectTemplate('template-1');

      templatesStore.removeTemplate('template-2');

      const state = get(templatesStore);
      expect(state.selectedTemplateId).toBe('template-1');
    });

    it('should handle removing non-existent template gracefully', () => {
      templatesStore.addTemplate(mockTemplate1);

      templatesStore.removeTemplate('nonexistent');

      const state = get(templatesStore);
      expect(state.templates.size).toBe(1);
      expect(state.templates.get('template-1')).toEqual(mockTemplate1);
    });
  });

  describe('selectTemplate', () => {
    it('should select a template', () => {
      templatesStore.addTemplate(mockTemplate1);
      templatesStore.selectTemplate('template-1');

      const state = get(templatesStore);
      expect(state.selectedTemplateId).toBe('template-1');
    });

    it('should allow deselecting by passing null', () => {
      templatesStore.addTemplate(mockTemplate1);
      templatesStore.selectTemplate('template-1');
      templatesStore.selectTemplate(null);

      const state = get(templatesStore);
      expect(state.selectedTemplateId).toBeNull();
    });

    it('should change selected template', () => {
      templatesStore.addTemplate(mockTemplate1);
      templatesStore.addTemplate(mockTemplate2);

      templatesStore.selectTemplate('template-1');
      let state = get(templatesStore);
      expect(state.selectedTemplateId).toBe('template-1');

      templatesStore.selectTemplate('template-2');
      state = get(templatesStore);
      expect(state.selectedTemplateId).toBe('template-2');
    });
  });

  describe('ruler measurements', () => {
    it('should set active ruler', () => {
      templatesStore.setActiveRuler(mockRuler);

      const state = get(templatesStore);
      expect(state.activeRuler).toEqual(mockRuler);
    });

    it('should clear active ruler', () => {
      templatesStore.setActiveRuler(mockRuler);
      templatesStore.setActiveRuler(null);

      const state = get(templatesStore);
      expect(state.activeRuler).toBeNull();
    });

    it('should add waypoint to active ruler', () => {
      templatesStore.setActiveRuler(mockRuler);
      templatesStore.addRulerWaypoint(20, 20);

      const state = get(templatesStore);
      expect(state.activeRuler?.waypoints).toHaveLength(3);
      expect(state.activeRuler?.waypoints[2]).toEqual({ x: 20, y: 20 });
    });

    it('should not add waypoint when no active ruler', () => {
      templatesStore.addRulerWaypoint(20, 20);

      const state = get(templatesStore);
      expect(state.activeRuler).toBeNull();
    });

    it('should update last waypoint of active ruler', () => {
      templatesStore.setActiveRuler(mockRuler);
      templatesStore.updateLastRulerWaypoint(15, 15);

      const state = get(templatesStore);
      expect(state.activeRuler?.waypoints).toHaveLength(2);
      expect(state.activeRuler?.waypoints[1]).toEqual({ x: 15, y: 15 });
    });

    it('should not update waypoint when no active ruler', () => {
      templatesStore.updateLastRulerWaypoint(15, 15);

      const state = get(templatesStore);
      expect(state.activeRuler).toBeNull();
    });

    it('should not update waypoint when ruler has no waypoints', () => {
      const emptyRuler: RulerMeasurement = {
        userId: 'user-1',
        sceneId: 'scene-1',
        waypoints: [],
        color: '#00ff00',
      };
      templatesStore.setActiveRuler(emptyRuler);
      templatesStore.updateLastRulerWaypoint(15, 15);

      const state = get(templatesStore);
      expect(state.activeRuler?.waypoints).toHaveLength(0);
    });
  });

  describe('getTemplatesForScene', () => {
    it('should get all templates for a specific scene', () => {
      templatesStore.addTemplate(mockTemplate1);
      templatesStore.addTemplate(mockTemplate2);
      templatesStore.addTemplate(mockTemplate3);

      const state = get(templatesStore);
      const scene1Templates = templatesStore.getTemplatesForScene('scene-1', state);

      expect(scene1Templates).toHaveLength(2);
      expect(scene1Templates).toContainEqual(mockTemplate1);
      expect(scene1Templates).toContainEqual(mockTemplate2);
      expect(scene1Templates).not.toContainEqual(mockTemplate3);
    });

    it('should return empty array for scene with no templates', () => {
      templatesStore.addTemplate(mockTemplate1);

      const state = get(templatesStore);
      const templates = templatesStore.getTemplatesForScene('scene-999', state);

      expect(templates).toEqual([]);
    });

    it('should return empty array when no templates exist', () => {
      const state = get(templatesStore);
      const templates = templatesStore.getTemplatesForScene('scene-1', state);

      expect(templates).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all templates and reset state', () => {
      templatesStore.addTemplate(mockTemplate1);
      templatesStore.addTemplate(mockTemplate2);
      templatesStore.selectTemplate('template-1');
      templatesStore.setActiveRuler(mockRuler);

      templatesStore.clear();

      const state = get(templatesStore);
      expect(state.templates.size).toBe(0);
      expect(state.selectedTemplateId).toBeNull();
      expect(state.activeRuler).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
