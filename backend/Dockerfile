FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=development \
    APP_MODE=lab \
    HOST=0.0.0.0 \
    PORT=4000 \
    ALLOW_CONTAINER_BIND=true

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY src ./src
COPY storage ./storage
RUN chown -R node:node /app

# Least privilege: never run the lab as root
USER node
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD wget -qO- --header="Host: localhost" http://127.0.0.1:4000/api/health || exit 1
CMD ["node", "src/server.js"]
