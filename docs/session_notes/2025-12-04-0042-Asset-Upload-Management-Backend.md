# Session Notes: Asset Upload and Management Backend

**Date**: 2025-12-04
**Session ID**: 0042
**Focus**: Implement backend for asset upload and management system

---

## Session Summary

Successfully implemented a complete backend system for asset upload and management. The implementation includes database schema, shared types, file upload handling with multipart support, image processing with thumbnail generation, and comprehensive REST API routes for asset CRUD operations. All code builds successfully and has been committed.

---

## Problems Addressed

### 1. Need for Asset Management Backend

**Symptom**: The VTT application needed a way to upload and manage assets (maps, tokens, portraits, tiles) for use in games.

**Root Cause**: No backend infrastructure existed for handling file uploads, storage, and retrieval.

**Investigation**:
- Reviewed existing route patterns in `apps/server/src/routes/api/v1/effects.ts`
- Examined database schema patterns in `packages/database/src/schema/activeEffects.ts`
- Checked shared types patterns in `packages/shared/src/types/activeEffect.ts`

---

## Solutions Implemented

### 1. Database Schema

**Location**: `packages/database/src/schema/assets.ts`

**Structure**:
- `id`: UUID primary key
- `userId`: Foreign key to users table (owner)
- `gameId`: Nullable foreign key to games table
- `filename`: Unique generated filename (UUID-based)
- `originalName`: Original uploaded filename
- `mimeType`: File MIME type
- `size`: File size in bytes
- `path`: Relative path to file
- `thumbnailPath`: Relative path to thumbnail (for images)
- `assetType`: Enum ('map', 'token', 'portrait', 'tile', 'other')
- `width`, `height`: Image dimensions (nullable)
- `name`: User-friendly name
- `description`: Asset description
- `tags`: Array of text tags for categorization
- `metadata`: JSONB field for additional data
- `createdAt`, `updatedAt`: Timestamps

**Exports**: Added to `packages/database/src/schema/index.ts`

### 2. Shared Types

**Location**: `packages/shared/src/types/asset.ts`

**Types Created**:
- `AssetType`: Type alias for asset categories
- `Asset`: Main interface matching database schema
- `CreateAssetRequest`: Request body for asset upload
- `UpdateAssetRequest`: Request body for metadata updates
- `AssetResponse`: Single asset response wrapper
- `AssetsListResponse`: List response with total count
- `AssetUploadResponse`: Upload success response

**Exports**: Added to `packages/shared/src/types/index.ts`

### 3. Dependencies Installed

**Packages**:
- `@fastify/multipart`: Handles multipart/form-data file uploads
- `@fastify/static`: Serves static files from uploads directory
- `sharp`: Image processing library for thumbnails and metadata
- `@types/sharp`: TypeScript definitions (dev dependency)

### 4. Fastify Plugins

**Multipart Plugin** (`apps/server/src/plugins/multipart.ts`):
- Configures multipart file upload support
- 10MB file size limit
- Maximum 1 file per upload
- Follows existing plugin pattern with fastify-plugin wrapper

**Static Files Plugin** (`apps/server/src/plugins/static.ts`):
- Serves uploaded files from `/uploads` directory
- Maps to `/uploads/` URL prefix
- Directory structure: `uploads/{userId}/{assetType}/{filename}`

### 5. Asset Service

**Location**: `apps/server/src/services/assetService.ts`

**Functions**:

**`saveUploadedFile(options)`**:
- Accepts: file, userId, assetType
- Generates unique UUID-based filename
- Creates directory structure if needed
- Saves file to disk
- For images:
  - Extracts dimensions using sharp
  - Generates 200x200 thumbnail
  - Maintains aspect ratio
- Returns: filename, path, thumbnailPath, width, height, size, mimeType

**`deleteFile(filePath, thumbnailPath)`**:
- Removes main file from disk
- Removes thumbnail if exists
- Handles errors gracefully

### 6. REST API Routes

**Location**: `apps/server/src/routes/api/v1/assets.ts`

**Endpoints**:

**POST /api/v1/assets/upload**:
- Accepts: multipart/form-data with file and metadata fields
- Fields: assetType, gameId, name, description, tags, metadata
- Saves file using asset service
- Creates database record
- Returns: AssetUploadResponse

**GET /api/v1/assets**:
- Query params: assetType, gameId, search
- Filters by user's assets
- Search matches name, description, originalName
- Returns: AssetsListResponse with array and total count

**GET /api/v1/assets/:assetId**:
- Fetches single asset by ID
- Checks ownership (403 if not owner)
- Returns: AssetResponse

**PATCH /api/v1/assets/:assetId**:
- Updates: name, description, tags, metadata, assetType, gameId
- Checks ownership
- Updates database record
- Returns: AssetResponse

**DELETE /api/v1/assets/:assetId**:
- Checks ownership
- Deletes files from disk (main + thumbnail)
- Deletes database record
- Returns: 204 No Content

**Common Features**:
- All routes require authentication
- Proper ownership checks
- Comprehensive error handling
- Type-safe with TypeScript

### 7. App Registration

**Modified Files**:
- `apps/server/src/app.ts`: Registered multipart and static plugins
- `apps/server/src/routes/api/v1/index.ts`: Registered assets route and added to API endpoint list

---

## Files Created/Modified

**Created**:
- `packages/database/src/schema/assets.ts` - Database schema
- `packages/shared/src/types/asset.ts` - Shared TypeScript types
- `apps/server/src/plugins/multipart.ts` - File upload plugin
- `apps/server/src/plugins/static.ts` - Static files plugin
- `apps/server/src/services/assetService.ts` - File operations service
- `apps/server/src/routes/api/v1/assets.ts` - REST API routes

**Modified**:
- `packages/database/src/schema/index.ts` - Added assets export
- `packages/shared/src/types/index.ts` - Added asset types export
- `apps/server/src/app.ts` - Registered new plugins
- `apps/server/src/routes/api/v1/index.ts` - Registered assets routes
- `apps/server/package.json` - Added dependencies
- `pnpm-lock.yaml` - Updated lockfile

---

## Testing Results

**Build Status**:
- Database package: Built successfully
- Shared package: Built successfully
- Server package: Built successfully
- Web package: Built successfully (with existing warnings)

**Database Migration**:
- Schema pushed to PostgreSQL using `drizzle-kit push`
- Assets table created successfully

**Compilation**:
- All TypeScript files compiled without errors
- Asset service compiled to `dist/services/assetService.js`
- Assets routes compiled to `dist/routes/api/v1/assets.js`
- Plugins compiled successfully

---

## Current Status

**Completed**:
- Database schema created and migrated
- Shared types implemented
- Dependencies installed
- Multipart and static file plugins created
- Asset service with file operations implemented
- Complete REST API with CRUD operations
- All files registered in app
- Build verified successful
- Changes committed to git

**Ready For**:
- Frontend UI implementation for asset upload
- Integration testing with actual file uploads
- Asset browser/gallery component
- Asset selection in token/scene configuration

---

## Next Steps

**Immediate**:
1. Create frontend UI for asset upload
2. Implement asset browser/gallery component
3. Integrate asset selection into token configuration
4. Add asset selection to scene background configuration

**Future Enhancements**:
1. Add support for bulk uploads
2. Implement asset folders/categories
3. Add asset sharing between games
4. Implement asset versioning
5. Add image cropping/editing tools
6. Support for additional file types (audio, video)
7. Add asset usage tracking (which scenes/tokens use which assets)
8. Implement asset CDN integration for production

---

## Key Learnings

### File Upload Patterns
- `@fastify/multipart` provides clean API for handling file uploads
- Important to set reasonable file size limits (10MB for this use case)
- Buffer-based file handling is simple and works well for moderate file sizes

### Image Processing
- `sharp` is powerful for image manipulation
- Thumbnail generation should maintain aspect ratio
- Extract metadata (dimensions) before generating thumbnails
- Handle non-image files gracefully (skip processing)

### Directory Structure
- Organizing by userId and assetType makes files easy to locate
- UUID-based filenames prevent collisions and security issues
- Store both original filename (for display) and unique filename (for storage)

### Database Design
- Nullable gameId allows personal assets not tied to specific games
- Text array for tags provides flexible categorization
- JSONB metadata field allows extensibility without schema changes
- Storing both path and thumbnailPath separately simplifies retrieval

---

**Session Completed**: All tasks completed successfully
**Commit Hash**: b4c7108
**Ready for**: Frontend asset upload UI implementation
