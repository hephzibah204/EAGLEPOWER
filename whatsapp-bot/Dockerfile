FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies needed for native modules (if any)
RUN apk add --no-cache git

# Copy package descriptors
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Environment variables
ENV NODE_ENV=production
ENV AUTH_DIR=/data/auth_info

# Expose no external web ports needed for Baileys, but volume directory
VOLUME ["/data"]

CMD ["npm", "start"]
