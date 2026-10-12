# Multi-stage production build for Eagle Power Schools EduCore
# Stage 1: Build Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Stage 2: Production Server Runtime
FROM node:22-alpine AS production
WORKDIR /app/server
ENV NODE_ENV=production
ENV PORT=5050

# Copy server dependencies
COPY server/package*.json ./
RUN npm ci --only=production --no-audit --no-fund

# Copy server code
COPY server/src ./src
COPY server/ecosystem.config.cjs ./

# Copy compiled frontend build from Stage 1 into /app/dist
COPY --from=frontend-builder /app/dist /app/dist

# Expose port
EXPOSE 5050

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5050/api/health || exit 1

# Start production server
CMD ["node", "src/index.js"]
