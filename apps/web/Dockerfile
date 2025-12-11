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
# Run tsc directly using the PATH that includes root node_modules/.bin
RUN cd packages/shared && tsc --project tsconfig.json
RUN pnpm --filter @vtt/web build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy built application from builder stage
# SvelteKit node adapter outputs to build/
COPY --from=builder /app/apps/web/build ./build
COPY --from=builder /app/apps/web/package.json ./package.json.orig

# Create a clean package.json without workspace dependencies for production
RUN cat ./package.json.orig | sed 's/"@vtt\/shared": "workspace:\*"/"@vtt\/shared": "file:..\/shared"/g' > ./package.json && \
    rm ./package.json.orig

# Copy the shared package dist for the file: reference
COPY --from=builder /app/packages/shared/dist ./shared/dist
COPY --from=builder /app/packages/shared/package.json ./shared/

# Install only production dependencies
RUN npm install --omit=dev --ignore-scripts

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5173
ENV HOST=0.0.0.0

# Expose port
EXPOSE 5173

# Run the SvelteKit node server
CMD ["node", "build"]
