# syntax=docker/dockerfile:1

# ---------- Build: compile the Angular application ----------
FROM node:24-alpine AS build
WORKDIR /workspace

# Dependencies first, so they stay cached while only the source code changes
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---------- Run: static files served by nginx as a non-root user ----------
FROM nginxinc/nginx-unprivileged:alpine

# Where /api is forwarded; docker-compose points it to the backend container
ENV BACKEND_URL=http://backend:8080

COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /workspace/dist/frontend/browser /usr/share/nginx/html

EXPOSE 8080

# 127.0.0.1 and not localhost: inside the container localhost resolves to IPv6 first
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
    CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
