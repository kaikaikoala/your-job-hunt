# Phase 2 Detailed Design: AI Agent Integration

## Overview

Add a conversational AI layer to the job hunt tracker. Users can describe actions in natural language — "I passed the phone screen at Stripe", "Add a follow-up task for Google" — and the agent translates that into structured API calls against the existing Java web service.

**Architecture:**
```
Browser (React SPA)
  ↓ REST (invoke)  /  SSE (stream)
Agent Service (FastAPI + LangChain/LangGraph, Python 3.12)
  ↓ REST + Firebase JWT forwarding
Web Service (Spring Boot, existing)
  ↓ JDBC / JPA
PostgreSQL (existing)
```

**Auth:** Agent service verifies Firebase JWT on every request. The same token is forwarded to the Java service so user data remains scoped by UID.

**LLM:** `claude-sonnet-4-6` via Anthropic SDK (`langchain-anthropic`).

**Session state:** In-memory `dict[sid → list[messages]]` on the agent service. No persistence in Phase 2 — sessions are lost on restart. `{sid}` is set by the caller:
- Application card chat → `app_id` (one session per application)
- Global dashboard chat → UUID generated client-side, stable per browser mount

**Delivery method:** Same vertical-slice approach as Phase 1. Each sub-task ships a working feature end-to-end and deploys to Render before the next begins.

---

## Design Decisions

| Concern | Decision |
|:--------|:---------|
| Agent framework | LangChain `create_react_agent` for `/invoke`; LangGraph `StateGraph` for `/stream` |
| LLM | `claude-sonnet-4-6` (Anthropic) |
| Python service location | `hunt_agent/` (new directory, separate from `hunt_flow/` prototypes) |
| Port | 8001 |
| Session ID source | `app_id` for card-level chat; client-generated UUID for global chat |
| Session storage | In-memory (Phase 2); no DB persistence |
| Auth forwarding | Firebase JWT passed as-is from frontend → agent → Java service |
| CLI testing | `hunt_agent/cli.py` with dev-mode flag (bypasses Firebase verification) |
| Streaming protocol | Server-Sent Events (SSE) — `text/event-stream` |

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

All routes require `Authorization: Bearer <firebase_id_token>`.

| Method | Path | Body | Response |
|:-------|:-----|:-----|:---------|
| POST | `/agents/hunt/{sid}/invoke` | `{message: str}` | `200 {response: str}` |
| POST | `/agents/hunt/{sid}/stream` | `{message: str}` | `200 text/event-stream` |
| GET | `/agents/hunt/{sid}/history` | — | `200 [{role, content}]` |
| DELETE | `/agents/{sid}` | — | `204` / `404` |

**SSE event format** (`/stream`):
```
data: {"type": "token", "content": "..."}

data: {"type": "done"}
```

---

## Sub-task 1: Hello World

Wire up the full roundtrip — frontend chat button → agent service → response displayed to user. Agent returns a hardcoded string; no LLM yet.

### `hunt_agent/` service

**Files to create:**
- `hunt_agent/pyproject.toml` — deps: `fastapi`, `uvicorn[standard]`, `firebase-admin`, `httpx`, `python-dotenv`
- `hunt_agent/main.py`:
  - `verify_token` FastAPI dependency — extracts Bearer token, calls `firebase_admin.auth.verify_id_token()`, returns `uid`
  - `POST /agents/hunt/{sid}/invoke` — returns `{"response": "Hello, world!"}`
  - CORS: `CORS_ALLOWED_ORIGIN` env var
- `hunt_agent/.env.example` — `FIREBASE_SERVICE_ACCOUNT`, `JAVA_API_URL`, `CORS_ALLOWED_ORIGIN`, `ANTHROPIC_API_KEY`
- `hunt_agent/Dockerfile` — Python 3.12-slim, `uvicorn main:app --host 0.0.0.0 --port 8001`

### Frontend

**New file:** `frontend/src/api/agents.ts`
```ts
invokeHuntAgent(sid: string, message: string): Promise<{ response: string }>
// POST ${VITE_AGENT_URL}/agents/hunt/${sid}/invoke via axiosInstance
```

**Modify:** `frontend/src/hunt-dashboard/ApplicationList.tsx`
- Add state: `chatOpen`, `chatInput`, `chatResponse`, `chatLoading`
- New icon button after Delete (same action row, `e.stopPropagation()`):
  ```tsx
  <Tooltip title="AI Assistant">
    <IconButton size="small" sx={{ color: onSurfaceVariant }} onClick={() => setChatOpen(true)}>
      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>smart_toy</span>
    </IconButton>
  </Tooltip>
  ```
- New Dialog (`chatOpen`):
  - Title: `"AI Assistant — {app.company}"`
  - Content: multiline `TextField` for input; response display `Box` (`bgcolor: surfaceContainerLow`, rounded, `minHeight: 60`)
  - Actions: Cancel + Submit (calls `invokeHuntAgent(app.appId, chatInput)`)
  - Reset `chatResponse` on close

**New env var** (add to `frontend/.env.local`): `VITE_AGENT_URL=http://localhost:8001`

**Update** `frontend/src/api/axiosInstance.ts` — no change needed; `agents.ts` imports existing instance.

### Deployment
- Add `hunt-agent` to `render.yaml` (Docker, port 8001)
- Add env vars: `JAVA_API_URL`, `FIREBASE_SERVICE_ACCOUNT` (from secret), `CORS_ALLOWED_ORIGIN`, `ANTHROPIC_API_KEY` (from secret)
- Add `VITE_AGENT_URL` to `jobhunt-frontend` service in `render.yaml`

**Done when:** Click chat icon on any ApplicationCard → type any message → submit → "Hello, world!" appears in dialog. Deployed and working on Render.

---

## Sub-task 2: LangChain Agent + CLI Testing

Replace the stub with a real LangChain ReAct agent. Validate locally via CLI before touching the frontend.

### `hunt_agent/` additions

**New file:** `hunt_agent/tools.py`
- One `@tool`-decorated function per agent tool (see table above)
- Each tool accepts a `token: str` parameter and calls the Java service via `httpx.AsyncClient`
- `JAVA_API_URL` read from environment

**New file:** `hunt_agent/agent.py`
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

**Update** `hunt_agent/main.py`
- Wire `POST /agents/hunt/{sid}/invoke` to call `invoke_agent(sid, message, token)`

**New file:** `hunt_agent/cli.py`
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

### `hunt_agent/` additions

**New file:** `hunt_agent/graph.py`
- LangGraph `StateGraph` mirroring the ReAct loop from Sub-task 2
- Exposes `astream_events()` for token-level streaming
- Same tools as Sub-task 2

**Update** `hunt_agent/main.py`
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
- Update `hunt_agent/` with new endpoints; redeploy `hunt-agent` service on Render
- `jobhunt-frontend` redeploys automatically via Render static site on push

**Done when:**
1. FAB visible on Hunt dashboard; click opens chat panel
2. Messages stream token-by-token in real time
3. Session persists within the same browser session
4. `DELETE /agents/{sid}` clears history (verify via `GET /agents/hunt/{sid}/history`)
5. Deployed and working on Render
