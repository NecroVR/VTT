import type { FastifyPluginAsync } from 'fastify';
import { assets } from '@vtt/database';
import { eq, and, like, or } from 'drizzle-orm';
import type { Asset, CreateAssetRequest, UpdateAssetRequest, AssetType } from '@vtt/shared';
import { authenticate } from '../../../middleware/auth.js';
import { saveUploadedFile, deleteFile } from '../../../services/assetService.js';

/**
 * Assets API routes
 * All routes require authentication
 * Handles asset upload, retrieval, update, and deletion
 */
const assetsRoute: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/v1/assets/upload - Upload a new asset
   * Handles multipart/form-data file upload
   */
  fastify.post<{ Body: CreateAssetRequest }>(
    '/assets/upload',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      try {
        // Get the uploaded file
        const data = await request.file();

        if (!data) {
          return reply.status(400).send({ error: 'No file uploaded' });
        }

        // Get metadata from fields
        const fields = data.fields as any;
        const assetType = (fields.assetType?.value as AssetType) || 'other';
        const gameId = fields.gameId?.value as string | undefined;
        const name = fields.name?.value as string | undefined;
        const description = fields.description?.value as string | undefined;
        const tags = fields.tags?.value ? JSON.parse(fields.tags.value as string) : undefined;
        const metadata = fields.metadata?.value ? JSON.parse(fields.metadata.value as string) : {};

        // Save file to disk
        const fileResult = await saveUploadedFile({
          file: data,
          userId: request.user.id,
          assetType,
        });

        // Create asset record in database
        const newAssets = await fastify.db
          .insert(assets)
          .values({
            userId: request.user.id,
            gameId: gameId || null,
            filename: fileResult.filename,
            originalName: data.filename,
            mimeType: fileResult.mimeType,
            size: fileResult.size,
            path: fileResult.path,
            thumbnailPath: fileResult.thumbnailPath || null,
            assetType,
            width: fileResult.width || null,
            height: fileResult.height || null,
            name: name || null,
            description: description || null,
            tags: tags || null,
            metadata,
          })
          .returning();

        const newAsset = newAssets[0];

        // Format response
        const formattedAsset: Asset = {
          id: newAsset.id,
          userId: newAsset.userId,
          gameId: newAsset.gameId,
          filename: newAsset.filename,
          originalName: newAsset.originalName,
          mimeType: newAsset.mimeType,
          size: newAsset.size,
          path: newAsset.path,
          thumbnailPath: newAsset.thumbnailPath,
          assetType: newAsset.assetType as AssetType,
          width: newAsset.width,
          height: newAsset.height,
          name: newAsset.name,
          description: newAsset.description,
          tags: newAsset.tags,
          metadata: newAsset.metadata as Record<string, unknown>,
          createdAt: newAsset.createdAt,
          updatedAt: newAsset.updatedAt,
        };

        return reply.status(201).send({
          asset: formattedAsset,
          message: 'Asset uploaded successfully',
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to upload asset');
        return reply.status(500).send({ error: 'Failed to upload asset' });
      }
    }
  );

  /**
   * GET /api/v1/assets - List user's assets with filtering
   * Query params: assetType, gameId, search
   */
  fastify.get<{
    Querystring: {
      assetType?: AssetType;
      gameId?: string;
      search?: string;
    };
  }>(
    '/assets',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { assetType, gameId, search } = request.query;

      try {
        // Build query conditions
        const conditions = [eq(assets.userId, request.user.id)];

        if (assetType) {
          conditions.push(eq(assets.assetType, assetType));
        }

        if (gameId) {
          conditions.push(eq(assets.gameId, gameId));
        }

        if (search) {
          conditions.push(
            or(
              like(assets.name, `%${search}%`),
              like(assets.description, `%${search}%`),
              like(assets.originalName, `%${search}%`)
            )!
          );
        }

        // Fetch assets
        const userAssets = await fastify.db
          .select()
          .from(assets)
          .where(and(...conditions));

        // Format response
        const formattedAssets: Asset[] = userAssets.map(asset => ({
          id: asset.id,
          userId: asset.userId,
          gameId: asset.gameId,
          filename: asset.filename,
          originalName: asset.originalName,
          mimeType: asset.mimeType,
          size: asset.size,
          path: asset.path,
          thumbnailPath: asset.thumbnailPath,
          assetType: asset.assetType as AssetType,
          width: asset.width,
          height: asset.height,
          name: asset.name,
          description: asset.description,
          tags: asset.tags,
          metadata: asset.metadata as Record<string, unknown>,
          createdAt: asset.createdAt,
          updatedAt: asset.updatedAt,
        }));

        return reply.status(200).send({
          assets: formattedAssets,
          total: formattedAssets.length,
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch assets');
        return reply.status(500).send({ error: 'Failed to fetch assets' });
      }
    }
  );

  /**
   * GET /api/v1/assets/:assetId - Get a single asset
   */
  fastify.get<{ Params: { assetId: string } }>(
    '/assets/:assetId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { assetId } = request.params;

      try {
        // Fetch asset
        const [asset] = await fastify.db
          .select()
          .from(assets)
          .where(eq(assets.id, assetId))
          .limit(1);

        if (!asset) {
          return reply.status(404).send({ error: 'Asset not found' });
        }

        // Check ownership
        if (asset.userId !== request.user.id) {
          return reply.status(403).send({ error: 'Access denied' });
        }

        // Format response
        const formattedAsset: Asset = {
          id: asset.id,
          userId: asset.userId,
          gameId: asset.gameId,
          filename: asset.filename,
          originalName: asset.originalName,
          mimeType: asset.mimeType,
          size: asset.size,
          path: asset.path,
          thumbnailPath: asset.thumbnailPath,
          assetType: asset.assetType as AssetType,
          width: asset.width,
          height: asset.height,
          name: asset.name,
          description: asset.description,
          tags: asset.tags,
          metadata: asset.metadata as Record<string, unknown>,
          createdAt: asset.createdAt,
          updatedAt: asset.updatedAt,
        };

        return reply.status(200).send({ asset: formattedAsset });
      } catch (error) {
        fastify.log.error(error, 'Failed to fetch asset');
        return reply.status(500).send({ error: 'Failed to fetch asset' });
      }
    }
  );

  /**
   * PATCH /api/v1/assets/:assetId - Update asset metadata
   */
  fastify.patch<{ Params: { assetId: string }; Body: UpdateAssetRequest }>(
    '/assets/:assetId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { assetId } = request.params;
      const updates = request.body;

      try {
        // Check if asset exists
        const [existingAsset] = await fastify.db
          .select()
          .from(assets)
          .where(eq(assets.id, assetId))
          .limit(1);

        if (!existingAsset) {
          return reply.status(404).send({ error: 'Asset not found' });
        }

        // Check ownership
        if (existingAsset.userId !== request.user.id) {
          return reply.status(403).send({ error: 'Access denied' });
        }

        // Build update object
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (updates.name !== undefined) {
          updateData.name = updates.name;
        }
        if (updates.description !== undefined) {
          updateData.description = updates.description;
        }
        if (updates.tags !== undefined) {
          updateData.tags = updates.tags;
        }
        if (updates.metadata !== undefined) {
          updateData.metadata = updates.metadata;
        }
        if (updates.assetType !== undefined) {
          updateData.assetType = updates.assetType;
        }
        if (updates.gameId !== undefined) {
          updateData.gameId = updates.gameId;
        }

        // Update asset in database
        const updatedAssets = await fastify.db
          .update(assets)
          .set(updateData)
          .where(eq(assets.id, assetId))
          .returning();

        const updatedAsset = updatedAssets[0];

        // Format response
        const formattedAsset: Asset = {
          id: updatedAsset.id,
          userId: updatedAsset.userId,
          gameId: updatedAsset.gameId,
          filename: updatedAsset.filename,
          originalName: updatedAsset.originalName,
          mimeType: updatedAsset.mimeType,
          size: updatedAsset.size,
          path: updatedAsset.path,
          thumbnailPath: updatedAsset.thumbnailPath,
          assetType: updatedAsset.assetType as AssetType,
          width: updatedAsset.width,
          height: updatedAsset.height,
          name: updatedAsset.name,
          description: updatedAsset.description,
          tags: updatedAsset.tags,
          metadata: updatedAsset.metadata as Record<string, unknown>,
          createdAt: updatedAsset.createdAt,
          updatedAt: updatedAsset.updatedAt,
        };

        return reply.status(200).send({ asset: formattedAsset });
      } catch (error) {
        fastify.log.error(error, 'Failed to update asset');
        return reply.status(500).send({ error: 'Failed to update asset' });
      }
    }
  );

  /**
   * DELETE /api/v1/assets/:assetId - Delete an asset
   * Deletes both the database record and the file from disk
   */
  fastify.delete<{ Params: { assetId: string } }>(
    '/assets/:assetId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { assetId } = request.params;

      try {
        // Check if asset exists
        const [existingAsset] = await fastify.db
          .select()
          .from(assets)
          .where(eq(assets.id, assetId))
          .limit(1);

        if (!existingAsset) {
          return reply.status(404).send({ error: 'Asset not found' });
        }

        // Check ownership
        if (existingAsset.userId !== request.user.id) {
          return reply.status(403).send({ error: 'Access denied' });
        }

        // Delete files from disk
        await deleteFile(existingAsset.path, existingAsset.thumbnailPath || undefined);

        // Delete asset from database
        await fastify.db
          .delete(assets)
          .where(eq(assets.id, assetId));

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete asset');
        return reply.status(500).send({ error: 'Failed to delete asset' });
      }
    }
  );
};

export default assetsRoute;
