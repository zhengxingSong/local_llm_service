#!/bin/sh
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log function
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Display startup information
log_info "=========================================="
log_info "Starting Qwen AI Service..."
log_info "=========================================="
log_info "Environment: ${NODE_ENV:-development}"
log_info "Port: ${PORT:-8000}"
log_info "llama.cpp: ${LLAMA_BASE_URL}"
log_info "=========================================="

# Create logs directory if it doesn't exist
mkdir -p /app/logs

# Verify models directory exists
if [ ! -d "/app/models" ]; then
    log_warn "Models directory not found at /app/models, creating..."
    mkdir -p /app/models
fi

# Check if llama.cpp is accessible
if [ -n "$LLAMA_BASE_URL" ]; then
    log_info "Waiting for llama.cpp at $LLAMA_BASE_URL"

    # Wait for llama.cpp to be ready (with timeout)
    if [ "$WAIT_FOR_LLAMA" = "true" ]; then
        TIMEOUT=${WAIT_FOR_LLAMA_TIMEOUT:-60}
        ELAPSED=0

        while [ $ELAPSED -lt $TIMEOUT ]; do
            if curl -f -s "$LLAMA_BASE_URL/health" > /dev/null 2>&1; then
                log_info "✓ llama.cpp is ready!"
                break
            fi
            echo -n "."
            sleep 2
            ELAPSED=$((ELAPSED + 2))
        done
        echo ""

        if [ $ELAPSED -ge $TIMEOUT ]; then
            log_error "Timeout waiting for llama.cpp at $LLAMA_BASE_URL"
            log_error "Please check llama-cpp container logs"
        fi
    fi
fi

# Handle graceful shutdown
trap 'log_info "Shutting down gracefully..."; exit 0' SIGTERM SIGINT

# Start the application
log_info "Starting server..."
exec "$@"
