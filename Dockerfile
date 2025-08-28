# ---- build (Vite) ----
FROM node:20-alpine AS build
WORKDIR /app

# Instala dependencias (aprovecha caché)
COPY package*.json ./
RUN npm ci

COPY . .
# Verifica que index.html exista antes de construir
RUN ls -la && test -f index.html

# Copia solo lo necesario para el build (mejor caché)
COPY tsconfig*.json vite.config.ts tailwind.config.js ./
COPY public ./public
COPY src ./src

# Inyecta el endpoint del API en tiempo de build (Vite solo lee VITE_* en build)
ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE

# Compila
RUN npm run build

# ---- runtime (Nginx) ----
FROM nginx:1.27-alpine AS runtime
ENV NODE_ENV=production

# Nginx con fallback para SPA (revisa que tengas este archivo en el repo)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Artefactos estáticos
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx","-g","daemon off;"]
