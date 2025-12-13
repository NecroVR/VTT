import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import pLimit from 'p-limit';

export interface ImageImportOptions {
  maxWidth?: number;
  maxHeight?: number;
  format?: 'webp' | 'png' | 'jpg';
  quality?: number;
}

/**
 * Image Import Service
 * Handles downloading, processing, and storing images from import sources
 */
export class ImageImportService {
  private readonly uploadDir = 'uploads/imports';
  private readonly defaultOptions: Required<ImageImportOptions> = {
    maxWidth: 512,
    maxHeight: 512,
    format: 'webp',
    quality: 85
  };

  /**
   * Download and store an image from URL
   */
  async importFromUrl(
    imageUrl: string,
    entityId: string,
    options: ImageImportOptions = {}
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };

    try {
      // Download image
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'VTT-Importer/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Process and save
      return await this.processAndSave(buffer, entityId, opts);
    } catch (error) {
      throw new Error(
        `Failed to import image from URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Import from uploaded file buffer
   */
  async importFromFile(
    fileBuffer: Buffer,
    originalPath: string,
    entityId: string,
    options: ImageImportOptions = {}
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };

    try {
      return await this.processAndSave(fileBuffer, entityId, opts);
    } catch (error) {
      throw new Error(
        `Failed to import image from file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Handle batch image imports with rate limiting
   */
  async importBatch(
    images: Array<{ url: string; entityId: string; options?: ImageImportOptions }>
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    // Process in parallel with rate limiting (max 5 concurrent)
    const limit = pLimit(5);

    await Promise.all(
      images.map(({ url, entityId, options }) =>
        limit(async () => {
          try {
            const localPath = await this.importFromUrl(url, entityId, options);
            results.set(entityId, localPath);
          } catch (error) {
            console.error(`Failed to import image for ${entityId}:`, error);
            results.set(entityId, ''); // Empty string indicates failure
          }
        })
      )
    );

    return results;
  }

  /**
   * Process image with Sharp and save to disk
   */
  private async processAndSave(
    buffer: Buffer,
    entityId: string,
    options: Required<ImageImportOptions>
  ): Promise<string> {
    // Process with Sharp
    const processed = await sharp(buffer)
      .resize(options.maxWidth, options.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFormat(options.format, { quality: options.quality })
      .toBuffer();

    // Generate filename with safe entity ID (remove path separators)
    const safeEntityId = entityId.replace(/[/\\]/g, '-');
    const filename = `${safeEntityId}.${options.format}`;
    const filepath = path.join(this.uploadDir, filename);

    // Ensure directory exists
    await fs.mkdir(this.uploadDir, { recursive: true });

    // Save file
    await fs.writeFile(filepath, processed);

    // Return URL path for database (using forward slashes for web URLs)
    return `/${this.uploadDir}/${filename}`.replace(/\\/g, '/');
  }

  /**
   * Delete an imported image
   */
  async deleteImage(imagePath: string): Promise<void> {
    try {
      // Remove leading slash if present
      const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
      await fs.unlink(cleanPath);
    } catch (error) {
      // Ignore errors if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`Failed to delete image ${imagePath}:`, error);
      }
    }
  }

  /**
   * Delete multiple images
   */
  async deleteImages(imagePaths: string[]): Promise<void> {
    await Promise.all(imagePaths.map(path => this.deleteImage(path)));
  }
}

// Export singleton instance
export const imageImportService = new ImageImportService();
