# syntax=docker/dockerfile:1

# Stage 1: generate gRPC stubs (build-time only)
FROM python:3.12-slim AS builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY proto/ ./proto/
RUN uvx --from grpcio-tools python -m grpc_tools.protoc \
    -I./proto \
    --python_out=. \
    --grpc_python_out=. \
    ./proto/agent_service.proto


# Stage 2: runtime image (no grpcio-tools, no proto source)
FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

COPY agent-service/pyproject.toml agent-service/uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    UV_SYSTEM_PYTHON=1 uv sync --frozen --no-install-project

COPY --from=builder /app/agent_service_pb2.py /app/agent_service_pb2_grpc.py ./
COPY agent-service/main.py .

EXPOSE 50051
CMD ["python", "main.py"]
