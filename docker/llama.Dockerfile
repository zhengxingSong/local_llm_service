FROM docker.1ms.run/library/ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /llama.cpp

# Download llama.cpp server binary (Linux CPU version)
# Latest version: b8209
ARG LLAMA_CPP_VERSION=b8209
# Try multiple mirrors for downloading
RUN wget --timeout=30 -q https://github.com/ggml-org/llama.cpp/releases/download/${LLAMA_CPP_VERSION}/llama-${LLAMA_CPP_VERSION}-bin-ubuntu-x64.tar.gz -O /tmp/llama.tar.gz || \
    wget --timeout=30 -q https://ghproxy.com/https://github.com/ggml-org/llama.cpp/releases/download/${LLAMA_CPP_VERSION}/llama-${LLAMA_CPP_VERSION}-bin-ubuntu-x64.tar.gz -O /tmp/llama.tar.gz || \
    curl -fL https://mirror.ghproxy.com/https://github.com/ggml-org/llama.cpp/releases/download/${LLAMA_CPP_VERSION}/llama-${LLAMA_CPP_VERSION}-bin-ubuntu-x64.tar.gz -o /tmp/llama.tar.gz

# Verify and extract
RUN mkdir -p /tmp/llama_extract && \
    tar -xzf /tmp/llama.tar.gz -C /tmp/llama_extract && \
    find /tmp/llama_extract -name "llama-server" -type f -exec cp {} /llama.cpp/server \; && \
    cp -r /tmp/llama_extract/llama-*/* /llama.cpp/ && \
    rm -rf /tmp/llama.tar.gz /tmp/llama_extract && \
    chmod +x /llama.cpp/server

# Create models directory
RUN mkdir -p /models && \
    mkdir -p /llama.cpp/cache

# Create non-root user
RUN useradd -m -u 1001 llama && \
    chown -R llama:llama /llama.cpp /models

USER llama

# Expose llama.cpp port
EXPOSE 8001

# Set library path
ENV LD_LIBRARY_PATH=/llama.cpp:$LD_LIBRARY_PATH

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Set working directory
WORKDIR /llama.cpp

# Start llama.cpp server
# Model path should be specified via command override in docker-compose.yml
CMD ["./server", \
     "--host", "0.0.0.0", \
     "--port", "8001", \
     "--ctx-size", "8192", \
     "--threads", "4", \
     "--n-gpu-layers", "35"]
