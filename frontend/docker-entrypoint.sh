#!/bin/sh
set -eu

: "${PORT:=80}"
: "${BACKEND_URL:=http://host.docker.internal:4001}"
: "${NOTIFICATION_URL:=http://host.docker.internal:4002}"

if [ -n "${BACKEND_HOST:-}" ]; then
  BACKEND_URL="https://${BACKEND_HOST}"
fi

if [ -n "${NOTIFICATION_HOST:-}" ]; then
  NOTIFICATION_URL="https://${NOTIFICATION_HOST}"
fi

export PORT BACKEND_URL NOTIFICATION_URL
envsubst '${PORT} ${BACKEND_URL} ${NOTIFICATION_URL}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
