/**
 * Fog exploration types
 * Used for fog of war tracking in scenes
 */

export type FogGrid = boolean[][];

export interface FogExploration {
  id: string;
  sceneId: string;
  userId: string;
  exploredGrid: FogGrid;
  revealedGrid: FogGrid;
  gridCellSize: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateFogExplorationRequest {
  sceneId: string;
  userId: string;
  exploredGrid?: FogGrid;
  revealedGrid?: FogGrid;
  gridCellSize?: number;
}

export interface UpdateFogExplorationRequest {
  exploredGrid?: FogGrid;
  revealedGrid?: FogGrid;
  gridCellSize?: number;
}

export interface RevealAreaRequest {
  // Grid coordinates to reveal (x, y, width, height)
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HideAreaRequest {
  // Grid coordinates to hide (x, y, width, height)
  x: number;
  y: number;
  width: number;
  height: number;
}
