import type { ContentParser, ParsedEntity } from '../../importService';
import type { RawImportItem, FoundryScene } from '@vtt/shared';

/**
 * Foundry Scene Parser
 * Transforms Foundry VTT scene exports (battle maps) into VTT format
 */
export class FoundrySceneParser implements ContentParser {

  async parse(item: RawImportItem): Promise<ParsedEntity> {
    const foundry = item.data as FoundryScene;

    const data = this.transformSceneData(foundry);

    return {
      entityType: 'scene',
      entityId: `foundry-${foundry._id}`,
      name: foundry.name,
      description: this.extractDescription(foundry),
      img: foundry.background?.src || foundry.img,
      data,
      sourceId: foundry._id
    };
  }

  private transformSceneData(foundry: FoundryScene): Record<string, unknown> {
    return {
      name: foundry.name,

      // Background image
      background: {
        src: foundry.background?.src || '',
        offsetX: 0,
        offsetY: 0
      },

      // Dimensions
      width: foundry.width || 4000,
      height: foundry.height || 3000,

      // Grid settings
      grid: {
        size: foundry.grid?.size || 100,
        type: this.mapGridType(foundry.grid?.type || 1),
        color: '#000000',
        alpha: 0.2,
        distance: 5,
        units: 'ft'
      },

      // Navigation (is this scene in nav bar?)
      navigation: foundry.navigation !== undefined ? foundry.navigation : false,

      // Walls (for line of sight)
      walls: this.transformWalls(foundry.walls),

      // Lights
      lights: this.transformLights(foundry.lights),

      // Tokens (placed on the scene)
      tokens: this.transformTokens(foundry.tokens),

      // Flags (preserve Foundry-specific data)
      flags: foundry.flags || {}
    };
  }

  private mapGridType(foundryGridType: number): string {
    // Foundry grid types: 1 = square, 2 = hex rows (odd), 3 = hex rows (even), 4 = hex columns (odd), 5 = hex columns (even)
    const gridTypeMap: Record<number, string> = {
      1: 'square',
      2: 'hexRowsOdd',
      3: 'hexRowsEven',
      4: 'hexColumnsOdd',
      5: 'hexColumnsEven'
    };
    return gridTypeMap[foundryGridType] || 'square';
  }

  private transformWalls(walls?: unknown[]): Array<Record<string, unknown>> {
    if (!walls || !Array.isArray(walls)) return [];

    return walls.map((wall: any) => ({
      id: wall._id || wall.id,
      c: wall.c || [], // coordinates [x1, y1, x2, y2]
      move: wall.move || 0, // movement restriction
      sight: wall.sight || 0, // vision restriction
      sound: wall.sound || 0, // sound restriction
      dir: wall.dir || 0, // direction (one-way walls)
      door: wall.door || 0, // door state
      ds: wall.ds || 0 // door sound
    }));
  }

  private transformLights(lights?: unknown[]): Array<Record<string, unknown>> {
    if (!lights || !Array.isArray(lights)) return [];

    return lights.map((light: any) => ({
      id: light._id || light.id,
      x: light.x || 0,
      y: light.y || 0,
      rotation: light.rotation || 0,
      bright: light.config?.bright || 0,
      dim: light.config?.dim || 0,
      angle: light.config?.angle || 360,
      color: light.config?.color || '#ffffff',
      alpha: light.config?.alpha || 0.5,
      animation: light.config?.animation || {}
    }));
  }

  private transformTokens(tokens?: unknown[]): Array<Record<string, unknown>> {
    if (!tokens || !Array.isArray(tokens)) return [];

    return tokens.map((token: any) => ({
      id: token._id || token.id,
      name: token.name || '',
      x: token.x || 0,
      y: token.y || 0,
      width: token.width || 1,
      height: token.height || 1,
      rotation: token.rotation || 0,
      img: token.texture?.src || token.img || '',
      actorId: token.actorId || null,
      hidden: token.hidden || false,
      locked: token.locked || false,
      elevation: token.elevation || 0,
      disposition: this.mapDisposition(token.disposition)
    }));
  }

  private mapDisposition(disposition?: number): string {
    // Foundry dispositions: -1 = hostile, 0 = neutral, 1 = friendly
    const dispositionMap: Record<number, string> = {
      '-1': 'hostile',
      '0': 'neutral',
      '1': 'friendly'
    };
    return dispositionMap[disposition ?? 0] || 'neutral';
  }

  private extractDescription(foundry: FoundryScene): string {
    // Scenes typically don't have descriptions in Foundry, but check flags
    return foundry.flags?.['core']?.['notes'] || '';
  }
}
