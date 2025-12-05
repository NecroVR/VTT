export type DrawingType = 'freehand' | 'rectangle' | 'circle' | 'ellipse' | 'polygon' | 'text';

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface Drawing {
  id: string;
  sceneId: string;
  authorId: string | null;
  drawingType: DrawingType;
  // Position and transform
  x: number;
  y: number;
  z: number;
  rotation: number;
  // Shape data
  points?: DrawingPoint[];
  width?: number | null;
  height?: number | null;
  radius?: number | null;
  // Stroke properties
  strokeColor: string;
  strokeWidth: number;
  strokeAlpha: number;
  // Fill properties
  fillColor: string | null;
  fillAlpha: number;
  // Text properties
  text?: string | null;
  fontSize?: number | null;
  fontFamily?: string | null;
  textColor?: string | null;
  // Visibility
  hidden: boolean;
  locked: boolean;
  // Metadata
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDrawingRequest {
  drawingType: DrawingType;
  x?: number;
  y?: number;
  z?: number;
  rotation?: number;
  points?: DrawingPoint[];
  width?: number;
  height?: number;
  radius?: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeAlpha?: number;
  fillColor?: string;
  fillAlpha?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  hidden?: boolean;
  locked?: boolean;
  data?: Record<string, unknown>;
}

export interface UpdateDrawingRequest {
  x?: number;
  y?: number;
  z?: number;
  rotation?: number;
  points?: DrawingPoint[];
  width?: number;
  height?: number;
  radius?: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeAlpha?: number;
  fillColor?: string;
  fillAlpha?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  hidden?: boolean;
  locked?: boolean;
  data?: Record<string, unknown>;
}

export interface DrawingResponse {
  drawing: Drawing;
}

export interface DrawingsListResponse {
  drawings: Drawing[];
}
