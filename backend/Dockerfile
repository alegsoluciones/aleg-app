# ----------------------------------------------------
# 👑 BACKEND DOCKERFILE (PRODUCTION READY)
# ----------------------------------------------------

# --- STAGE 1: BUILDER ---
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Install dependencies (Optimized for caching)
COPY package*.json ./
RUN npm ci

# 2. Build the application
COPY . .
RUN npm run build

# --- STAGE 2: RUNNER (LIGHTWEIGHT) ---
FROM node:20-alpine AS runner

# Hardening: Run as non-root user
USER node
WORKDIR /home/node/app

# 3. Copy only necessary artifacts
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

# 4. Environment
ENV NODE_ENV=production
EXPOSE 3000

# Volume for persistent storage (Documentation of Intent)
VOLUME ["/home/node/app/storage"]

# 5. Launch
CMD ["node", "dist/main"]
