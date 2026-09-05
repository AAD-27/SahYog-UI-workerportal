FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/*
COPY build/ /usr/share/nginx/html/
RUN test -s /usr/share/nginx/html/index.html \
    && test -d /usr/share/nginx/html/static

EXPOSE 4200

HEALTHCHECK --interval=5s --timeout=3s --start-period=10s --retries=12 \
  CMD wget --quiet --spider http://127.0.0.1:4200/health || exit 1
