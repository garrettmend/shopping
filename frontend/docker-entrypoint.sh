#!/bin/sh
set -eu

: "${PORT:=80}"
: "${BACKEND_URL:=http://host.docker.internal:4001}"
: "${NOTIFICATION_URL:=http://host.docker.internal:4002}"

if [ -n "${BACKEND_HOST:-}" ]; then
  BACKEND_URL="${BACKEND_HOST}"
fi

if [ -n "${NOTIFICATION_HOST:-}" ]; then
  NOTIFICATION_URL="${NOTIFICATION_HOST}"
fi

normalize_url() {
  case "$1" in
    http://*|https://*) printf '%s' "$1" ;;
    *) printf 'https://%s' "$1" ;;
  esac | sed 's:/*$::'
}

BACKEND_URL="$(normalize_url "$BACKEND_URL")"
NOTIFICATION_URL="$(normalize_url "$NOTIFICATION_URL")"

export PORT BACKEND_URL NOTIFICATION_URL
envsubst '${PORT} ${BACKEND_URL} ${NOTIFICATION_URL}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
