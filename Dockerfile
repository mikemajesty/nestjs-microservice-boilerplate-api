# @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/setup/docker.md

# =============================================================================
# STAGE 1: Build (using full Node image to compile the app)
# =============================================================================
FROM node:22.12 AS build

WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Install ALL dependencies (needed for build)
RUN npm ci && npm install @swc/cli @swc/core --save-dev

# Copy source code
COPY . .

# Build the application
RUN npm run build

# =============================================================================
# STAGE 2: Production (smaller image for runtime)
# =============================================================================
FROM node:22.12-alpine AS production

# Add labels for better maintainability
LABEL maintainer="mike.rodrigues.lima@gmail.com"
LABEL description="NestJS Microservice Boilerplate API"

# Set NODE_ENV
ENV NODE_ENV=prod

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nestjs

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && \
  npm cache clean --force

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Copy OpenAPI spec (needed for Swagger)
COPY --from=build /app/api-spec/tsp-output ./api-spec/tsp-output

# Set ownership to non-root user
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start the application
CMD ["node", "dist/main.js"]
