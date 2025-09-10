# ---- build (Vite) ----
FROM node:20-alpine AS build
WORKDIR /app

# Opcional: evita ruidos de npm
ENV NPM_CONFIG_AUDIT=false NPM_CONFIG_FUND=false

# Copia manifests e instala deps en modo reproducible
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copia el resto del proyecto (src, public, index.html, etc.)
COPY . .

# Inyecta la base de la API (CapRover → Build-time env)
ARG VITE_API_BASE
ENV VITE_API_BASE=${VITE_API_BASE}

# Build de producción
RUN npm run build

# ---- runtime (Nginx) ----
FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html

# Copia configuración SPA y bloquea sw.js
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia artefactos compilados
COPY --from=build /app/dist ./

# (Opcional) Healthcheck simple a index.html
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD \
  wget -qO- http://localhost/index.html >/dev/null 2>&1 || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
