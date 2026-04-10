# Phase 2 Detailed Design: AI Agent Integration

## Overview

Add a conversational AI layer to the job hunt tracker. Users can describe actions in natural language — "I passed the phone screen at Stripe", "Add a follow-up task for Google" — and the agent translates that into structured API calls against the existing Java web service.

**Architecture:**
```
Browser (React SPA)
  ↓ REST
Web Service (Spring Boot, existing)
  ↓ gRPC (proto/agent_service.proto)
Agent Service (grpcio + LangGraph, Python 3.12)   ← internal only, never public
  ↓ read-only SQL (Phase 3+)
PostgreSQL (existing)
```

**Auth:** Firebase JWT is verified by the web service (existing `FirebaseTokenFilter`). The Firebase UID is forwarded to the agent service via `HuntInvokeRequest.uid` — the agent service never handles tokens directly.

**LLM:** `claude-sonnet-4-6` via Anthropic SDK (`langchain-anthropic`).

**Session state:** In-memory `dict[sid → list[messages]]` on the agent service. No persistence in Phase 2 — sessions are lost on restart. `{sid}` is set by the caller:
- Application card chat → `app_id` (one session per application)
- Global dashboard chat → UUID generated client-side, stable per browser mount

**Delivery method:** Same vertical-slice approach as Phase 1. Each sub-task ships a working feature end-to-end and deploys to Render before the next begins.

---

## Design Decisions

| Concern | Decision |
|:--------|:---------|
| Agent framework | LangChain `create_react_agent` for `InvokeHuntAgent`; LangGraph `StateGraph` for streaming (Sub-task 3) |
| LLM | `claude-sonnet-4-6` via Anthropic SDK |
| Python service location | `agent-service/` (new directory, separate from `hunt_flow/` prototypes) |
| Transport | gRPC (proto: `proto/agent_service.proto`); port 50051 |
| Render service type | `pserv` (private service — binds a port, internal-only) |
| Session ID source | `app_id` for card-level chat; client-generated UUID for global chat |
| Session storage | In-memory (Phase 2); no DB persistence |
| Auth | Firebase JWT verified at web service; UID forwarded via `HuntInvokeRequest.uid` |
| CLI testing | `agent-service/cli.py` with a static dev token (Sub-task 2) |
| Streaming protocol | gRPC server streaming (Sub-task 3) |

---

## Agent Tools

The agent has read/write access to the Java web service REST API via `httpx`. Each tool call includes `Authorization: Bearer <token>`.

| Tool | Method + Path | Description |
|:-----|:-------------|:------------|
| `get_applications` | `GET /applications` | List all of the user's applications |
| `create_application` | `POST /applications` | Add a new application (`company`, `role`, optional: `job_posting_url`, `salary_range`) |
| `update_application` | `PATCH /applications/{app_id}` | Update application fields |
| `create_stage` | `POST /applications/{app_id}/stages` | Record a new stage (`stage`, `stage_date`, optional: `result`) |
| `create_action_item` | `POST /action-items` | Add a follow-up task (`description`, optional: `app_id`, `due_date`) |
| `create_network_contact` | `POST /network` | Add a new contact (`name`, `type`) |

---

## Agent Service API

The agent service exposes gRPC RPCs defined in `proto/agent_service.proto`. The web service is the only caller — the frontend never contacts the agent service directly.

**Public REST API** (web service, Firebase-authenticated):

| Method | Path | Body | Response |
|:-------|:-----|:-----|:---------|
| POST | `/agents/hunt/{sid}/invoke` | `{message: str}` | `200 {response: str}` |
| POST | `/agents/hunt/{sid}/stream` | `{message: str}` | `200 text/event-stream` (Sub-task 3) |
| GET | `/agents/hunt/{sid}/history` | — | `200 [{role, content}]` (Sub-task 3) |
| DELETE | `/agents/{sid}` | — | `204` / `404` (Sub-task 3) |

**Internal gRPC RPCs** (agent service, called by web service):

| RPC | Request | Response |
|:----|:--------|:---------|
| `InvokeHuntAgent` | `HuntInvokeRequest {sid, message, uid}` | `HuntInvokeResponse {response}` |
| `StreamHuntAgent` *(Sub-task 3)* | `HuntInvokeRequest` | `stream HuntStreamChunk {type, content}` |

---

## Sub-task 1: Hello World

Wire up the full roundtrip — frontend chat button → web service → agent service → response displayed to user. Agent returns a hardcoded string; no LLM yet.

### `agent-service/` (gRPC server)

`agent-service/` is the single Python gRPC server that hosts all agents across phases. RPCs are defined in `proto/agent_service.proto`.

**Files:**
- `agent-service/pyproject.toml` — deps: `grpcio`; dev: `grpcio-tools`, `pytest`
- `agent-service/main.py` — `AgentServiceServicer.InvokeHuntAgent` returns `"Hello, world!"`; listens on `:50051`
- `agent-service/conftest.py` — auto-generates stubs before pytest
- `agent-service/.gitignore` — excludes generated `*_pb2.py` files
- `agent-service/Dockerfile` — context `.` (repo root); generates stubs from `proto/`; runs `uv run main.py`
- `proto/agent_service.proto` — `InvokeHuntAgent(HuntInvokeRequest) returns (HuntInvokeResponse)`

### Web service additions

**New files:**
- `AgentController.kt` — `POST /agents/hunt/{sid}/invoke`; forwards to `AgentGrpcClient`; authenticated by existing `FirebaseTokenFilter`
- `AgentGrpcClient.kt` — blocking gRPC stub connecting to `agent.grpc.host:agent.grpc.port`

**Modified files:**
- `build.gradle.kts` — protobuf plugin + gRPC deps
- `Dockerfile` — `COPY proto/` in build stage
- `application.properties` — `agent.grpc.host/port` properties

### Frontend

Use a [MUI Popper](https://mui.com/material-ui/react-popper/) anchored to the AI icon button on the application card. The popper must not block or obscure the rest of the dashboard — the user should be able to read other cards while it is open.

This is a **single-message interaction**: the user describes a data update, the agent responds with a confirmation of what changed. There is no conversation history and no multi-turn UI.

**New file:** `frontend/src/api/agents.ts`
```ts
invokeHuntAgent(sid: string, message: string): Promise<{ response: string }>
// POST /agents/hunt/${sid}/invoke via existing axiosInstance (calls web service)
```

**New file:** `frontend/src/hunt-dashboard/AppAiAssistant.tsx`
- Lazy-loaded component (`React.lazy`); only bundled and fetched when first opened
- Props: `appId: string`, `company: string`, `anchorEl: HTMLElement | null`, `open: boolean`, `onClose: () => void`
- Renders a `Popper` (`placement="bottom-start"`, `disablePortal=false`) anchored to `anchorEl`
- Internal state: `chatInput`, `chatResponse`, `chatLoading`
- Title: `"AI Assistant — {company}"`
- Input: single `TextField` for the user's message
- Response: `Box` (`bgcolor: surfaceContainerLow`, rounded, `minHeight: 60`) — shown only after a response arrives; displays the agent's confirmation of what was changed
- Submit button: calls `invokeHuntAgent(appId, chatInput)`, sets `chatLoading` while waiting
- Close (X) icon: calls `onClose`; reset `chatResponse` and `chatInput` on close (via `useEffect` on `open`)
- While `chatLoading`: disable input and submit button
- No conversation history displayed

**Modify:** `frontend/src/hunt-dashboard/ApplicationList.tsx`
- Lazy-load the component:
  ```tsx
  const AppAiAssistant = React.lazy(() => import('./AppAiAssistant'));
  ```
- Add state per card: `chatOpen`, `chatAnchorEl`
- New icon button after Delete (same action row, `e.stopPropagation()`):
  ```tsx
  <Tooltip title="AI Assistant">
    <IconButton size="small" sx={{ color: onSurfaceVariant }}
      onClick={(e) => { setChatAnchorEl(e.currentTarget); setChatOpen(true); }}>
      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>smart_toy</span>
    </IconButton>
  </Tooltip>
  ```
- Render (after the icon button, still inside the card):
  ```tsx
  <Suspense fallback={null}>
    <AppAiAssistant
      appId={app.appId}
      company={app.company}
      anchorEl={chatAnchorEl}
      open={chatOpen}
      onClose={() => setChatOpen(false)}
    />
  </Suspense>
  ```

**Note:** No new env vars needed for the frontend — `agents.ts` calls the web service via the existing `axiosInstance` (uses `VITE_API_URL`).

### Deployment
- Add `jobhunt-agent` to `render.yaml` as `type: pserv` (private service, port 50051, `dockerContext: .`)
- Add `AGENT_GRPC_HOST=jobhunt-agent` to `jobhunt-api` env vars in `render.yaml`
- Add `ANTHROPIC_API_KEY` (secret) to `jobhunt-agent` env vars

**Done when:** Click chat icon on any ApplicationCard → type any message → submit → "Hello, world!" appears. Deployed and working on Render.

---

## Sub-task 2: LangChain Agent + CLI Testing

Replace the stub with a real LangChain ReAct agent. Validate locally via CLI before touching the frontend.

### `agent_service/` additions
Note for claude: Agent service needs to route to a hunt agent graph. The hunt agent will be a separate graph from the phase 3 resume agent.

**New file:** `agent_service/tools.py`
- One `@tool`-decorated function per agent tool (see table above)
- Each tool accepts a `token: str` parameter and calls the Java service via `httpx.AsyncClient`
- `JAVA_API_URL` read from environment

**New file:** `agent_service/hunt_agent.py`
```python
def make_agent(token: str):
    # Returns a LangChain AgentExecutor (create_react_agent)
    # System prompt: job hunt assistant with today's date injected
    # Tools: all tools from tools.py, partially applied with token
    ...

def invoke_agent(sid: str, message: str, token: str) -> str:
    # Retrieves or creates session history (dict[sid, list[BaseMessage]])
    # Runs agent with history, appends new messages
    # Returns string response
    ...
```

**Update** `agent_service/main.py`
- Wire `POST /agents/hunt/{sid}/invoke` to call `invoke_agent(sid, message, token)`

**New file:** `agent_service/cli.py`
```
Usage: python cli.py
Env: JAVA_API_URL, JAVA_API_TOKEN (static dev token, bypasses Firebase)

Session: <uuid>
> I applied to Google for a SWE role
Agent: Got it — I've added a new application for Software Engineer at Google.
> I just passed the phone screen
Agent: Done! I've recorded a "Phone Screen" stage with today's date.
>
```
- `DEV_MODE=true` flag skips `verify_id_token`, uses `JAVA_API_TOKEN` directly

### Done when:
1. `python cli.py` → can create applications, stages, action items via natural language
2. Click chat icon on frontend → real agent response (not hardcoded)
3. Deploy to Render, verify in production

---

## Sub-task 3: SSE Streaming + Global Chat FAB

Replace the synchronous invoke with streaming. Add a persistent chat panel accessible from anywhere on the Hunt dashboard.

### `agent_service/` additions

**New file:** `agent_service/graph.py`
- LangGraph `StateGraph` mirroring the ReAct loop from Sub-task 2
- Exposes `astream_events()` for token-level streaming
- Same tools as Sub-task 2

**Update** `agent_service/main.py`
- `POST /agents/hunt/{sid}/stream` — `StreamingResponse(content=event_generator(), media_type="text/event-stream")`
  - Calls `graph.astream_events(...)`, yields `data: {type: token, content: ...}` per LLM token
  - Final event: `data: {type: done}`
- `GET /agents/hunt/{sid}/history` — returns `[{role, content}]` from in-memory session
- `DELETE /agents/{sid}` — removes session from memory, returns 204 (404 if not found)

### Frontend

**New file:** `frontend/src/hunt-dashboard/HuntChatPanel.tsx`
- Bottom-right fixed position: FAB (`chat_bubble` icon) always visible
- Click FAB → panel slides up (MUI `Collapse` or CSS transition)
- Panel dimensions: `width: 380px`, `height: 520px`, `borderRadius: 3`, `bgcolor: surfaceContainerLowest`, `border: 1px solid borderSubtle`
- Header: "Hunt Assistant" title + close (X) icon
- Messages area: scrollable, user bubbles right-aligned (`bgcolor: primary, color: white`), assistant bubbles left-aligned (`bgcolor: surfaceContainerLow`)
- Streaming: assistant message renders tokens as they arrive
- Input: `TextField` + send `IconButton` at bottom; disabled while streaming
- Session ID: `useRef(crypto.randomUUID())` — stable per component mount, resets on unmount

**Update** `frontend/src/api/agents.ts`
```ts
streamHuntAgent(
  sid: string,
  message: string,
  onToken: (t: string) => void,
  onDone: () => void
): Promise<void>
// Uses fetch + ReadableStream to consume SSE from VITE_AGENT_URL

getHuntHistory(sid: string): Promise<{role: string, content: string}[]>

clearHuntSession(sid: string): Promise<void>
```

**Modify** `frontend/src/hunt-dashboard/HuntPage.tsx`
- Add `<HuntChatPanel />` as the last child in the page root `Box`

### Deployment
- Update `agent_service/` with new endpoints; redeploy `hunt-agent` service on Render
- `jobhunt-frontend` redeploys automatically via Render static site on push

**Done when:**
1. FAB visible on Hunt dashboard; click opens chat panel
2. Messages stream token-by-token in real time
3. Session persists within the same browser session
4. `DELETE /agents/{sid}` clears history (verify via `GET /agents/hunt/{sid}/history`)
5. Deployed and working on Render
