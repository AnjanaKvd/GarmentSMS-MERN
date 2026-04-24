FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/GSMS/package*.json ./
RUN npm ci --legacy-peer-deps

COPY frontend/GSMS/ ./
# Inject production API URL at build time
ENV VITE_API_BASE_URL=/api/
RUN npm run build

# ─── STAGE 2: Production Runtime ──────────────────────────
FROM ubuntu:24.04

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=production

# Install Node.js 20, MongoDB 7.0, Nginx, Supervisor
RUN apt-get update && \
    apt-get install -y curl gnupg ca-certificates nginx supervisor && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
    gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor && \
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
    https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
    tee /etc/apt/sources.list.d/mongodb-org-7.0.list && \
    apt-get update && \
    apt-get install -y mongodb-org && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create MongoDB data directory (mount Azure Files here at runtime)
RUN mkdir -p /data/db /var/log/mongodb /var/log/supervisor /run/nginx

# ─── Backend ──────────────────────────────────────────────
WORKDIR /app/backend
COPY backend/GSMS-Backend/package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps
COPY backend/GSMS-Backend/ ./

# ─── Nginx config ─────────────────────────────────────────
COPY docker/nginx.conf /etc/nginx/nginx.conf

# ─── Supervisor config ────────────────────────────────────
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# ─── Frontend static build ────────────────────────────────
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# ─── Entrypoint ───────────────────────────────────────────
COPY docker/docker-start.sh /docker-start.sh
RUN chmod +x /docker-start.sh

EXPOSE 80

ENTRYPOINT ["/docker-start.sh"]