# Agent Service

Internal gRPC server that hosts all AI agents. It is never publicly reachable — the web service is the only caller. Routes are namespaced by agent type via RPCs defined in `proto/agent_service.proto`:

- `InvokeHuntAgent` — job hunt tracking agent (Phase 2)
- *(Phase 3) resume agent RPCs*

## Environment variables

| Variable | Required | Description |
|:---------|:---------|:------------|
| `ANTHROPIC_API_KEY` | Yes (Sub-task 2+) | Anthropic API key for LLM calls |
| `JAVA_API_URL` | Yes (Sub-task 2+) | Base URL of the web service, for any write-back calls |

No Firebase credentials needed — authentication is handled entirely by the web service, which forwards the Firebase UID via `HuntInvokeRequest.uid`.

## Local setup

```bash
cd agent-service
uv sync --extra dev   # installs grpcio-tools for stub generation

# Generate gRPC stubs from proto (re-run whenever proto/agent_service.proto changes)
uv run python -m grpc_tools.protoc \
    -I../proto \
    --python_out=. \
    --grpc_python_out=. \
    ../proto/agent_service.proto

python main.py   # listens on :50051
```

## Running tests

`conftest.py` auto-generates the stubs before each run — no manual step needed:

```bash
cd agent-service
uv run pytest
```

## Manual smoke test

With the agent service running locally and the web service also running:

```bash
curl -X POST http://localhost:8080/agents/hunt/test-sid/invoke \
  -H "Authorization: Bearer <firebase-id-token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "hello"}'
# → {"response":"Hello, world!"}
```
