# =========================
# 1) Build (Vite/React)
# =========================
FROM node:20-alpine AS build
WORKDIR /app

ENV NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Build args (opcionales)
ARG VITE_API_BASE
ARG PWA_MODE
ENV VITE_API_BASE=${VITE_API_BASE} \
    PWA_MODE=${PWA_MODE}

RUN npm run build

# =========================
# 2) Runtime (Nginx)
# =========================
FROM nginx:1.27-alpine AS serve
WORKDIR /usr/share/nginx/html

# Nginx para SPA + bloquear service workers
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Artefactos
COPY --from=build /app/dist ./

# 🔒 Anti-PWA: garantizamos que no queden SW en la imagen
RUN rm -f /usr/share/nginx/html/sw.js \
         /usr/share/nginx/html/service-worker.js \
         /usr/share/nginx/html/registerSW.js || true

# Salud y puerto
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost/index.html >/dev/null 2>&1 || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
