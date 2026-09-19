# Builds the React app and serves it from nginx, which also proxies /api to the
# backend container. Used by docker-compose.yml so the whole thing runs with one
# command and no Node installed on the host.

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Empty on purpose: the app then calls a same-origin "/api", which nginx forwards to
# the backend. Deployed separately (Vercel + Render), set VITE_API_BASE_URL instead.
ENV VITE_API_BASE_URL=""
RUN npm run build

# ---------- serve ----------
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist /usr/share/nginx/html
EXPOSE 80
