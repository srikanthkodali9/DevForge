# Multi-stage Dockerfile for DevForge

# Stage 1: Build the React SPA
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install packages
RUN npm ci

# Copy application source code
COPY . .

# Compile TypeScript and build production SPA
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:stable-alpine AS runner

# Copy built static assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx configuration for single page application routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
