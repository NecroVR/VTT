export type TextAnchor = 'top' | 'bottom' | 'left' | 'right';

export interface ScenePin {
  id: string;
  sceneId: string;
  // Position
  x: number;
  y: number;
  // Icon properties
  icon?: string | null;
  iconSize: number;
  iconTint?: string | null;
  // Text properties
  text?: string | null;
  fontSize: number;
  textAnchor: string;
  textColor: string;
  // Link to journal
  journalId?: string | null;
  pageId?: string | null;
  // State
  global: boolean; // show on all scenes
  // Metadata
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScenePinRequest {
  x: number;
  y: number;
  icon?: string;
  iconSize?: number;
  iconTint?: string;
  text?: string;
  fontSize?: number;
  textAnchor?: TextAnchor;
  textColor?: string;
  journalId?: string;
  pageId?: string;
  global?: boolean;
  data?: Record<string, unknown>;
}

export interface UpdateScenePinRequest {
  x?: number;
  y?: number;
  icon?: string;
  iconSize?: number;
  iconTint?: string;
  text?: string;
  fontSize?: number;
  textAnchor?: TextAnchor;
  textColor?: string;
  journalId?: string;
  pageId?: string;
  global?: boolean;
  data?: Record<string, unknown>;
}

export interface ScenePinResponse {
  pin: ScenePin;
}

export interface ScenePinsListResponse {
  pins: ScenePin[];
}
