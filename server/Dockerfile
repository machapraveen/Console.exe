FROM node:16-alpine as build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy rest of the application
COPY . .

# Remove development dependencies
RUN npm prune --production

# Production stage
FROM node:16-alpine

# Set environment variables
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Install system dependencies
RUN apk --no-cache add curl

# Copy from build stage
COPY --from=build /app /app

# Create non-root user and switch to it
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

# Start the server
CMD ["node", "src/server.js"]