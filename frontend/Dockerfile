# ==============================================================================
# CloudPulse Frontend Dockerfile (Multi-Stage Build + Hardened Non-Root Nginx)
# ==============================================================================

# Stage 1: Build static assets
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source and build production bundle
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Nginx Runtime
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built distribution files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom hardened Nginx configuration
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# Security hardening: grant permissions to non-root nginx user
RUN touch /tmp/nginx.pid && \
    chown -R nginx:nginx /tmp/nginx.pid /var/cache/nginx /var/log/nginx /usr/share/nginx/html /etc/nginx

# Switch to non-root user
USER nginx

# Expose default HTTP port
EXPOSE 80

# Health check probe
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
