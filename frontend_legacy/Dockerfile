# ----------------------------------------------------
# 👑 FRONTEND DOCKERFILE (PRODUCTION READY)
# ----------------------------------------------------

# --- STAGE 1: BUILDER ---
FROM node:18-alpine AS builder

WORKDIR /app

# 1. Install dependencies
COPY package*.json ./
RUN npm ci

# 2. Build React App
COPY . .
RUN npm run build

# --- STAGE 2: SERVER (NGINX) ---
FROM nginx:alpine

# 3. Copy Build Artifacts
COPY --from=builder /app/dist /usr/share/nginx/html

# 4. Copy Custom Nginx Config (SPA Routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 5. Exposure
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
