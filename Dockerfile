# Multi-stage build for single container
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend files
COPY backend/package*.json ./
RUN npm install

COPY backend/ ./
RUN npm run build

# Final stage - Node.js with nginx
FROM node:20-alpine

# Install nginx
RUN apk add --no-cache nginx

# Copy backend build and rebuild native modules for this platform
COPY --from=backend-builder /app/backend/dist /app/backend/dist
COPY --from=backend-builder /app/backend/package*.json /app/backend/
WORKDIR /app/backend
RUN npm install --only=production && npm rebuild better-sqlite3
WORKDIR /

# Copy frontend files
COPY index.html style.css script.js backend-admin.html akupelikilinc.jpg /usr/share/nginx/html/

# Create data directory for SQLite
RUN mkdir -p /app/data

# Copy nginx config (replace default)
COPY nginx.conf /etc/nginx/nginx.conf

# Copy startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Create nginx directories
RUN mkdir -p /run/nginx

# Expose port
EXPOSE 80

# Start both nginx and backend
CMD ["/start.sh"]
