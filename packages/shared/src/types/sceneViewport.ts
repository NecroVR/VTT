export interface SceneViewport {
  id: string;
  userId: string;
  sceneId: string;
  cameraX: number;
  cameraY: number;
  zoom: number;
  updatedAt: Date;
}

export interface SaveViewportRequest {
  cameraX: number;
  cameraY: number;
  zoom: number;
}

export interface ViewportResponse {
  viewport: SceneViewport | null;
}
