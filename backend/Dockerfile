FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code (excluding node_modules)
COPY src ./src
COPY nest-cli.json ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY typeorm.config.ts ./

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Remove build dependencies
RUN apk del python3 make g++

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/src/main.js"]