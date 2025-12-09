import type { FastifyPluginAsync } from 'fastify';
import { assets, users } from '@vtt/database';
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

        // Get file size by buffering the file
        const buffer = await data.toBuffer();
        const fileSize = buffer.length;

        // Check user's storage quota before processing
        const [user] = await fastify.db
          .select({
            storageUsedBytes: users.storageUsedBytes,
            storageQuotaBytes: users.storageQuotaBytes,
            accountTier: users.accountTier,
          })
          .from(users)
          .where(eq(users.id, request.user.id))
          .limit(1);

        if (!user) {
          return reply.status(404).send({ error: 'User not found' });
        }

        const remainingBytes = user.storageQuotaBytes - user.storageUsedBytes;

        // Check if user has enough storage
        if (user.storageUsedBytes + fileSize > user.storageQuotaBytes) {
          return reply.status(413).send({
            error: 'QUOTA_EXCEEDED',
            message: 'Storage quota exceeded',
            details: {
              usedBytes: user.storageUsedBytes,
              quotaBytes: user.storageQuotaBytes,
              remainingBytes,
              fileSize,
              tier: user.accountTier,
            },
          });
        }

        // Get metadata from fields
        const fields = data.fields as any;
        const assetType = (fields.assetType?.value as AssetType) || 'other';
        const campaignId = fields.campaignId?.value as string | undefined;
        const name = fields.name?.value as string | undefined;
        const description = fields.description?.value as string | undefined;
        const tags = fields.tags?.value ? JSON.parse(fields.tags.value as string) : undefined;
        const metadata = fields.metadata?.value ? JSON.parse(fields.metadata.value as string) : {};

        // Save file to disk (pass the buffer we already created)
        const fileResult = await saveUploadedFile({
          file: data,
          userId: request.user.id,
          assetType,
        });

        // Use a transaction to ensure atomicity between asset creation and storage update
        const result = await fastify.db.transaction(async (tx) => {
          // Create asset record in database
          const newAssets = await tx
            .insert(assets)
            .values({
              userId: request.user!.id,
              campaignId: campaignId || null,
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

          // Update user's storage usage
          await tx
            .update(users)
            .set({
              storageUsedBytes: user.storageUsedBytes + fileResult.size,
              updatedAt: new Date(),
            })
            .where(eq(users.id, request.user!.id));

          return newAsset;
        });

        const newAsset = result;

        // Format response
        const formattedAsset: Asset = {
          id: newAsset.id,
          userId: newAsset.userId,
          campaignId: newAsset.campaignId,
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
   * Query params: assetType, campaignId, search
   */
  fastify.get<{
    Querystring: {
      assetType?: AssetType;
      campaignId?: string;
      search?: string;
    };
  }>(
    '/assets',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      const { assetType, campaignId, search } = request.query;

      try {
        // Build query conditions
        const conditions = [eq(assets.userId, request.user.id)];

        if (assetType) {
          conditions.push(eq(assets.assetType, assetType));
        }

        if (campaignId) {
          conditions.push(eq(assets.campaignId, campaignId));
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
          campaignId: asset.campaignId,
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
          campaignId: asset.campaignId,
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
        if (updates.campaignId !== undefined) {
          updateData.campaignId = updates.campaignId;
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
          campaignId: updatedAsset.campaignId,
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

        // Get user's current storage usage
        const [user] = await fastify.db
          .select({
            storageUsedBytes: users.storageUsedBytes,
          })
          .from(users)
          .where(eq(users.id, request.user.id))
          .limit(1);

        if (!user) {
          return reply.status(404).send({ error: 'User not found' });
        }

        // Delete files from disk
        await deleteFile(existingAsset.path, existingAsset.thumbnailPath || undefined);

        // Use a transaction to ensure atomicity between asset deletion and storage update
        await fastify.db.transaction(async (tx) => {
          // Delete asset from database
          await tx
            .delete(assets)
            .where(eq(assets.id, assetId));

          // Update user's storage usage (decrease by asset size)
          const newStorageUsed = Math.max(0, user.storageUsedBytes - existingAsset.size);
          await tx
            .update(users)
            .set({
              storageUsedBytes: newStorageUsed,
              updatedAt: new Date(),
            })
            .where(eq(users.id, request.user!.id));
        });

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error, 'Failed to delete asset');
        return reply.status(500).send({ error: 'Failed to delete asset' });
      }
    }
  );
};

export default assetsRoute;
