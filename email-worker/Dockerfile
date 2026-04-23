# syntax=docker/dockerfile:1
FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

COPY email-worker/pyproject.toml email-worker/uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project

ENV PATH="/app/.venv/bin:$PATH"

COPY email-worker/main.py email-worker/config.py email-worker/db.py email-worker/gmail_client.py ./
COPY email-worker/chains/ ./chains/

EXPOSE 8001
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
