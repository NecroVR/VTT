import type { FastifyPluginAsync } from 'fastify';
import { importService } from '../../../services/importService.js';
import { authenticate } from '../../../middleware/auth.js';
import { z } from 'zod';
import type { ImportRequest, ImportSourceType, ContentType } from '@vtt/shared';

/**
 * Import API routes
 * All routes require authentication
 * Handles content import from Foundry VTT, D&D Beyond, and other sources
 */
const importRoute: FastifyPluginAsync = async (fastify) => {
  // Validation schemas
  const importRequestSchema = z.object({
    sourceType: z.enum(['foundryvtt', 'dndbeyond', 'manual']),
    contentType: z.enum(['actor', 'item', 'spell', 'class', 'subclass', 'race', 'subrace', 'background', 'feat', 'scene', 'journal', 'rolltable', 'playlist']),
    items: z.array(z.object({
      sourceId: z.string(),
      name: z.string(),
      type: z.string(),
      data: z.unknown(),
      img: z.string().optional(),
      folder: z.string().optional()
    })),
    sourceName: z.string(),
    sourceVersion: z.string().optional()
  });

  /**
   * POST /api/v1/import
   * Start a new import job (JSON body)
   */
  fastify.post<{ Body: ImportRequest }>(
    '/import',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      try {
        // Validate request body
        const validatedRequest = importRequestSchema.parse(request.body);

        // Create import job
        const job = await importService.createImportJob(
          fastify.db,
          request.user.id,
          validatedRequest as ImportRequest
        );

        return reply.status(201).send({ success: true, data: job });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid import request',
            details: error.issues
          });
        }

        fastify.log.error(error, 'Failed to start import');
        return reply.status(500).send({
          success: false,
          error: 'Failed to start import'
        });
      }
    }
  );

  /**
   * POST /api/v1/import/upload
   * Upload Foundry VTT JSON file for import
   */
  fastify.post(
    '/import/upload',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      try {
        // Get the uploaded file
        const data = await request.file({
          limits: {
            fileSize: 50 * 1024 * 1024 // 50MB limit
          }
        });

        if (!data) {
          return reply.status(400).send({
            success: false,
            error: 'No file uploaded'
          });
        }

        // Check file type
        if (!data.mimetype.includes('json') && !data.mimetype.includes('zip')) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid file type. Please upload a JSON or ZIP file.'
          });
        }

        // Read file content
        const buffer = await data.toBuffer();

        let jsonContent: any;

        if (data.mimetype.includes('json')) {
          // Parse JSON directly
          const textContent = buffer.toString('utf-8');
          jsonContent = JSON.parse(textContent);
        } else if (data.mimetype.includes('zip')) {
          // TODO: Handle ZIP files (extract and parse)
          // For now, return an error
          return reply.status(400).send({
            success: false,
            error: 'ZIP file support not yet implemented. Please upload JSON files for now.'
          });
        }

        // Summarize the Foundry export for preview
        const preview = summarizeFoundryExport(jsonContent);

        return reply.send({
          success: true,
          data: {
            filename: data.filename,
            size: buffer.length,
            preview
          }
        });
      } catch (error) {
        fastify.log.error(error, 'Failed to upload file');
        return reply.status(500).send({
          success: false,
          error: 'Failed to parse uploaded file'
        });
      }
    }
  );

  /**
   * GET /api/v1/import/jobs
   * List user's import jobs
   */
  fastify.get<{
    Querystring: {
      sourceType?: string;
      limit?: string;
    };
  }>(
    '/import/jobs',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      try {
        const sourceType = request.query.sourceType as ImportSourceType | undefined;
        const limit = Math.min(parseInt(request.query.limit || '20'), 100);

        const jobs = await importService.listJobs(
          fastify.db,
          request.user.id,
          sourceType,
          limit
        );

        return reply.send({ success: true, data: jobs });
      } catch (error) {
        fastify.log.error(error, 'Failed to list import jobs');
        return reply.status(500).send({
          success: false,
          error: 'Failed to list import jobs'
        });
      }
    }
  );

  /**
   * GET /api/v1/import/jobs/:jobId
   * Get import job status
   */
  fastify.get<{
    Params: {
      jobId: string;
    };
  }>(
    '/import/jobs/:jobId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      try {
        const job = await importService.getJobStatus(
          fastify.db,
          request.params.jobId,
          request.user.id
        );

        if (!job) {
          return reply.status(404).send({
            success: false,
            error: 'Import job not found'
          });
        }

        return reply.send({ success: true, data: job });
      } catch (error) {
        fastify.log.error(error, 'Failed to get import job');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get import job'
        });
      }
    }
  );

  /**
   * GET /api/v1/import/sources
   * List user's import sources
   */
  fastify.get<{
    Querystring: {
      sourceType?: string;
    };
  }>(
    '/import/sources',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      try {
        const sourceType = request.query.sourceType as ImportSourceType | undefined;

        const sources = await importService.listSources(
          fastify.db,
          request.user.id,
          sourceType
        );

        return reply.send({ success: true, data: sources });
      } catch (error) {
        fastify.log.error(error, 'Failed to list import sources');
        return reply.status(500).send({
          success: false,
          error: 'Failed to list import sources'
        });
      }
    }
  );

  /**
   * DELETE /api/v1/import/sources/:sourceId
   * Delete an import source and its entities
   */
  fastify.delete<{
    Params: {
      sourceId: string;
    };
  }>(
    '/import/sources/:sourceId',
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Not authenticated' });
      }

      try {
        await importService.deleteSource(
          fastify.db,
          request.params.sourceId,
          request.user.id
        );

        return reply.send({
          success: true,
          message: 'Import source deleted'
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({
            success: false,
            error: error.message
          });
        }

        fastify.log.error(error, 'Failed to delete import source');
        return reply.status(500).send({
          success: false,
          error: 'Failed to delete import source'
        });
      }
    }
  );
};

/**
 * Helper function to summarize Foundry export data
 */
function summarizeFoundryExport(data: any) {
  return {
    system: data.system || 'unknown',
    systemVersion: data.systemVersion,
    foundryVersion: data.foundryVersion,
    type: data.type || 'unknown',
    counts: {
      actors: data.actors?.length ?? 0,
      items: data.items?.length ?? 0,
      scenes: data.scenes?.length ?? 0,
      journals: data.journals?.length ?? 0,
      tables: data.tables?.length ?? 0,
      playlists: data.playlists?.length ?? 0
    }
  };
}

export default importRoute;
