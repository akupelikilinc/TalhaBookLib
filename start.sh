#!/bin/sh

# Start backend in background
cd /app/backend
node dist/index.js &

# Start nginx in foreground
nginx -g 'daemon off;'

