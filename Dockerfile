# Build: static files with Vite
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_* end up in the public bundle: never pass secrets here
ARG VITE_API_URL=
ARG VITE_WS_URL=
ARG VITE_CAGE_ID=cage-1
ARG VITE_USE_MOCKS=false
RUN npm run build

# Serve: Caddy on port 80, behind the main Caddy of the EC2
FROM caddy:2.11-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 80
