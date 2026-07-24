# ============================================================
# YYC³ AI 生态系统 - 多阶段 Dockerfile
# 多阶段构建: deps → build → runtime (最小镜像)
# ============================================================

# ===== Stage 1: deps (基础依赖) =====
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 启用 corepack + pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# 先复制 lockfile 利用 Docker 层缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/full/package.json ./apps/full/
COPY packages/shell/package.json ./packages/shell/
COPY packages/plugin-ai-family/package.json ./packages/plugin-ai-family/
COPY packages/plugin-dynasty/package.json ./packages/plugin-dynasty/
COPY packages/plugin-monitor/package.json ./packages/plugin-monitor/
COPY packages/plugin-ops/package.json ./packages/plugin-ops/
COPY packages/plugin-ai/package.json ./packages/plugin-ai/
COPY packages/plugin-dev/package.json ./packages/plugin-dev/
COPY packages/plugin-admin/package.json ./packages/plugin-admin/
COPY packages/plugin-target/package.json ./packages/plugin-target/
COPY packages/plugin-cost/package.json ./packages/plugin-cost/
COPY packages/plugin-marketing/package.json ./packages/plugin-marketing/
COPY packages/plugin-prompt/package.json ./packages/plugin-prompt/
COPY packages/plugin-llm/package.json ./packages/plugin-llm/

RUN pnpm install --frozen-lockfile --prefer-offline

# ===== Stage 2: builder =====
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/full/node_modules ./apps/full/node_modules

COPY . .

# 构建时环境变量
ENV NODE_ENV=production
ENV VITE_APP_ENV=production

RUN pnpm type-check && \
    pnpm --filter @yyc3/app-full build

# ===== Stage 3: runtime (Nginx 静态托管) =====
FROM nginx:alpine AS runtime

# 移除默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义 Nginx 配置 (含安全头 + gzip + SPA fallback)
COPY <<'EOF' /etc/nginx/conf.d/yyc3.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # ===== gzip =====
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript application/wasm text/javascript image/svg+xml;

    # ===== 安全头 (与 vercel.json 一致) =====
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://dashscope.aliyuncs.com https://api.deepseek.com https://api.moonshot.cn; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(self), camera=(), payment=(), usb=()" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Embedder-Policy "require-corp" always;

    # ===== 静态资源缓存 =====
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # ===== SPA fallback =====
    location / {
        try_files $uri $uri/ /index.html;
    }

    # ===== 健康检查 =====
    location = /healthz {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
EOF

# 复制构建产物
COPY --from=builder /app/apps/full/dist /usr/share/nginx/html

# 非 root 用户
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:80/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
