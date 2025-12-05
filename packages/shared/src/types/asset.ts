// Asset type alias
export type AssetType = 'map' | 'token' | 'portrait' | 'tile' | 'other';

// Asset interface
export interface Asset {
  id: string;
  userId: string;
  gameId?: string | null;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  thumbnailPath?: string | null;
  assetType: AssetType;
  width?: number | null;
  height?: number | null;
  name?: string | null;
  description?: string | null;
  tags?: string[] | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Create Asset Request
export interface CreateAssetRequest {
  gameId?: string | null;
  assetType?: AssetType;
  name?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

// Update Asset Request
export interface UpdateAssetRequest {
  name?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  assetType?: AssetType;
  gameId?: string | null;
}

// Response interfaces
export interface AssetResponse {
  asset: Asset;
}

export interface AssetsListResponse {
  assets: Asset[];
  total: number;
}

export interface AssetUploadResponse {
  asset: Asset;
  message: string;
}
