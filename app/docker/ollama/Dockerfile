# Custom Ollama Dockerfile for MUDlands AI Integration
FROM ollama/ollama:latest

# Install monitoring tools
RUN apt-get update && apt-get install -y \
    curl \
    htop \
    iotop \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

# Create directories for models and content
RUN mkdir -p /root/.ollama/models /data/ai-content

# Copy custom configuration if needed
COPY config/ /config/

# Set up model pulling script
RUN echo '#!/bin/bash\n\
echo "Pulling Llama 3.1 8B model..."\n\
ollama pull llama3.1:8b\n\
echo "Model pull complete"\n\
ollama list' > /usr/local/bin/pull-models.sh && \
chmod +x /usr/local/bin/pull-models.sh

# Health check script
RUN echo '#!/bin/bash\n\
curl -f http://localhost:11434/api/tags || exit 1' > /usr/local/bin/health-check.sh && \
chmod +x /usr/local/bin/health-check.sh

EXPOSE 11434

# Start Ollama service
CMD ["serve"]