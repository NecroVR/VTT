# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/server/package.json ./apps/server/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Add root node_modules/.bin to PATH for hoisted executables
ENV PATH="/app/node_modules/.bin:$PATH"

# Copy source code
COPY apps/server ./apps/server
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY turbo.json ./

# Build the application
RUN pnpm --filter @vtt/server build
RUN pnpm --filter @vtt/database build
RUN pnpm --filter @vtt/shared build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/server/package.json ./apps/server/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder stage
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Copy database migrations
COPY --from=builder /app/packages/database/drizzle ./packages/database/drizzle

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "apps/server/dist/index.js"]
