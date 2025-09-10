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

FROM nginx:1.27-alpine AS serve
WORKDIR /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist ./

# 🧹 quitar cualquier SW que haya quedado en dist
RUN find /usr/share/nginx/html -maxdepth 1 -type f \( -name "sw.js" -o -name "service-worker.js" -o -name "registerSW.js" \) -delete

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost/index.html >/dev/null 2>&1 || exit 1
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
