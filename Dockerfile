# Single-service image for hosted classroom deployment (Render).
# Builds the React app and serves it from the Express backend; database = SQLite.
# Local multi-container setup stays in docker-compose.yml.

FROM node:20-bookworm-slim AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

FROM node:20-bookworm-slim AS deps
WORKDIR /app
# Build tools only as a fallback if the sqlite3 prebuilt binary is unavailable.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && node -e "require('sqlite3')"

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=development \
    APP_MODE=lab \
    LAB_DEPLOYMENT=hosted \
    HOST=0.0.0.0 \
    PORT=10000 \
    DB_DIALECT=sqlite \
    DB_STORAGE=/app/data/vulnshop.sqlite \
    FRONTEND_DIST=/app/public
COPY --from=deps /app/node_modules ./node_modules
COPY backend/package.json ./
COPY backend/src ./src
COPY backend/storage ./storage
COPY --from=frontend /app/dist ./public
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
EXPOSE 10000
CMD ["node", "src/server.js"]
