FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Install runtime + stub-generation deps
COPY agent-service/pyproject.toml .
RUN uv pip install --system --no-cache \
    "grpcio>=1.67.0" \
    "grpcio-tools>=1.67.0" \
    "python-dotenv>=1.0.0"

# Generate gRPC stubs from the canonical proto
COPY proto/ ./proto/
RUN python -m grpc_tools.protoc \
    -I./proto \
    --python_out=. \
    --grpc_python_out=. \
    ./proto/agent_service.proto

COPY agent-service/main.py .

EXPOSE 50051
CMD ["python", "main.py"]
