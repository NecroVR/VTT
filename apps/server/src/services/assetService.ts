import type { MultipartFile } from '@fastify/multipart';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import type { AssetType } from '@vtt/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Asset Service
 * Handles file storage and manipulation for uploaded assets
 */

export interface SaveUploadedFileOptions {
  file: MultipartFile;
  userId: string;
  assetType: AssetType;
}

export interface SaveUploadedFileResult {
  filename: string;
  path: string;
  thumbnailPath?: string;
  width?: number;
  height?: number;
  size: number;
  mimeType: string;
}

/**
 * Get the uploads directory path
 */
function getUploadsDir(): string {
  return path.join(__dirname, '..', '..', 'uploads');
}

/**
 * Ensure directory exists, create if it doesn't
 */
async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Generate a unique filename with UUID
 */
function generateFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename);
  const uuid = crypto.randomUUID();
  return `${uuid}${ext}`;
}

/**
 * Check if file is an image based on MIME type
 */
function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Save uploaded file to disk and generate thumbnail if it's an image
 */
export async function saveUploadedFile(options: SaveUploadedFileOptions): Promise<SaveUploadedFileResult> {
  const { file, userId, assetType } = options;

  // Generate unique filename
  const filename = generateFilename(file.filename);

  // Create directory structure: /uploads/{userId}/{assetType}/
  const userDir = path.join(getUploadsDir(), userId, assetType);
  await ensureDirectory(userDir);

  // Full file path
  const filePath = path.join(userDir, filename);
  // Store path with /uploads/ prefix so frontend URLs work correctly
  const relativePath = `/uploads/${userId}/${assetType}/${filename}`;

  // Save file to disk
  const buffer = await file.toBuffer();
  await fs.writeFile(filePath, buffer);

  // Get file size
  const size = buffer.length;
  const mimeType = file.mimetype;

  // If it's an image, get dimensions and create thumbnail
  let width: number | undefined;
  let height: number | undefined;
  let thumbnailPath: string | undefined;

  if (isImage(mimeType)) {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      width = metadata.width;
      height = metadata.height;

      // Generate thumbnail (max 200x200)
      const thumbnailFilename = `thumb_${filename}`;
      const thumbnailFilePath = path.join(userDir, thumbnailFilename);
      const thumbnailRelativePath = `/uploads/${userId}/${assetType}/${thumbnailFilename}`;

      await image
        .resize(200, 200, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFile(thumbnailFilePath);

      thumbnailPath = thumbnailRelativePath;
    } catch (error) {
      console.error('Failed to process image:', error);
      // Continue without thumbnail if processing fails
    }
  }

  return {
    filename,
    path: relativePath,
    thumbnailPath,
    width,
    height,
    size,
    mimeType,
  };
}

/**
 * Strip /uploads/ prefix from path for filesystem operations
 */
function stripUploadsPrefix(urlPath: string): string {
  if (urlPath.startsWith('/uploads/')) {
    return urlPath.slice('/uploads/'.length);
  }
  return urlPath;
}

/**
 * Delete file from disk
 */
export async function deleteFile(filePath: string, thumbnailPath?: string): Promise<void> {
  const uploadsDir = getUploadsDir();

  // Delete main file (strip /uploads/ prefix since it's already the root)
  try {
    const fullPath = path.join(uploadsDir, stripUploadsPrefix(filePath));
    await fs.unlink(fullPath);
  } catch (error) {
    console.error(`Failed to delete file ${filePath}:`, error);
  }

  // Delete thumbnail if it exists
  if (thumbnailPath) {
    try {
      const fullThumbnailPath = path.join(uploadsDir, stripUploadsPrefix(thumbnailPath));
      await fs.unlink(fullThumbnailPath);
    } catch (error) {
      console.error(`Failed to delete thumbnail ${thumbnailPath}:`, error);
    }
  }
}
