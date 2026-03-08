# ============================================
# Stage 1: Dependencies
# ============================================
FROM docker.1ms.run/library/node:20-alpine AS dependencies

# Install build dependencies for Sharp
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev \
    libc6-compat

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for Sharp build)
RUN npm ci && \
    npm cache clean --force

# ============================================
# Stage 2: Build
# ============================================
FROM docker.1ms.run/library/node:20-alpine AS build

# Install build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# ============================================
# Stage 3: Production
# ============================================
FROM docker.1ms.run/library/node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    libc6-compat \
    curl \
    tzdata \
    vips

# Set timezone
ENV TZ=UTC

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy dependencies from dependencies stage
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application from build stage
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist

# Copy configuration files
COPY --chown=nodejs:nodejs config ./config
COPY --chown=nodejs:nodejs package.json ./

# Copy entrypoint and healthcheck scripts
COPY --chown=nodejs:nodejs docker/entrypoint.sh /entrypoint.sh
COPY --chown=nodejs:nodejs docker/healthcheck.sh /healthcheck.sh

# Create logs directory
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app/logs

# Make scripts executable
RUN chmod +x /entrypoint.sh /healthcheck.sh

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD /healthcheck.sh

# Set entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Default command
CMD ["node", "dist/main.js"]
