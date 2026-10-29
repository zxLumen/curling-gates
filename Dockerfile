# 冰壶大作战 · 静态原型(HTML5 Canvas,无依赖、无需构建)
# 镜像:ghcr.io/zxlumen/curling-web,由 .github/workflows/build.yml 构建推送
# 线上入口:curling.<DOMAIN>,容器监听 80,由博客 Caddy 反代(见 zxLumen-Blog 的
# docker/caddy/sites/curling.caddy)

FROM nginx:1.29-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html styles.css game.js /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
