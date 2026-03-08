#!/bin/sh

# Health check endpoint
HEALTH_URL="http://localhost:${PORT:-8000}/api/health"

# Perform health check
response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")

if [ "$response" = "200" ]; then
    exit 0
else
    exit 1
fi
