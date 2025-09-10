# =========================
# 1) Build (Vite/React)
# =========================
FROM node:20-alpine AS build
WORKDIR /app
ENV NPM_CONFIG_AUDIT=false NPM_CONFIG_FUND=false
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_BASE
ARG PWA_MODE
ENV VITE_API_BASE=${VITE_API_BASE} PWA_MODE=${PWA_MODE}
RUN npm run build

# =========================
# 2) Runtime (Nginx)
# =========================
FROM nginx:1.27-alpine AS serve
WORKDIR /usr/share/nginx/html

# Nginx para SPA + bloquear SW
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist ./

# Barrer cualquier service worker por si las moscas
RUN find /usr/share/nginx/html -maxdepth 1 -type f \( -name "sw.js" -o -name "service-worker.js" -o -name "registerSW.js" \) -delete

# ⬇️⬇️  **AQUÍ EL FIX**: usar 127.0.0.1 y no localhost (evita IPv6 ::1)
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/index.html >/dev/null 2>&1 || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
