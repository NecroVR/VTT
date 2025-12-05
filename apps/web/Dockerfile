# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Add root node_modules/.bin to PATH for hoisted executables
ENV PATH="/app/node_modules/.bin:$PATH"

# Copy source code
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared
COPY turbo.json ./

# Copy certificates for build (needed for vite.config.ts)
COPY certs ./certs

# Build the application
RUN pnpm --filter @vtt/shared build
RUN pnpm --filter @vtt/web build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install pnpm and serve for static file serving
RUN npm install -g pnpm http-server

# Copy built application from builder stage
COPY --from=builder /app/apps/web/build ./build

# Expose port
EXPOSE 5173

# Serve the built application with HTTPS
CMD ["http-server", "build", "-p", "5173", "--ssl", "--cert", "/app/certs/localhost.pem", "--key", "/app/certs/localhost-key.pem"]
