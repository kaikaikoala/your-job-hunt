# email-worker

Private background service that syncs a user's Gmail inbox and creates job application records from job-related emails.

## Architecture

The email worker is a FastAPI HTTP service deployed on Render's private network. It is called by the web service after creating an `email_syncs` row — never directly by the frontend.

```
frontend → web-service (POST /email-syncs)
               ↓ creates email_syncs row (status='running')
               ↓ HTTP POST /sync (Render internal network)
          email-worker
               ↓ Gmail API (fetch latest 100 emails)
               ↓ FilterAgent  — LLM: is this job-related?
               ↓ OrchestratorAgent — LLM: extract company/role
               ↓ tools.add_application — psycopg2 → PostgreSQL
               ↓ UPDATE email_syncs SET status='completed'
```

## File structure

```
email-worker/
├── Dockerfile
├── pyproject.toml
├── main.py               # FastAPI app — POST /sync, GET /health
├── gmail_client.py       # Gmail API: fetch latest 100 emails filtered by label
├── db.py                 # psycopg2 ThreadedConnectionPool (1–5 conns)
├── config.py             # env vars (loads .env.local in dev)
└── chains/
    ├── __init__.py
    ├── filter_agent.py        # LLM: is this email job-related?
    ├── orchestrator_agent.py  # LLM: extract application fields
    └── tools.py               # DB write: add_application
```

## API

| Method | Path | Description |
|:-------|:-----|:------------|
| `POST` | `/sync` | Fetch and process emails; update sync row status |
| `GET` | `/health` | Health check |

### POST /sync — request body

```json
{
  "sync_id": "uuid",
  "user_id": "uuid",
  "access_token": "decrypted-google-oauth-token",
  "refresh_token": "decrypted-google-oauth-refresh-token",
  "token_expiry": "2024-01-01T00:00:00Z",
  "label": "optional-gmail-label"
}
```

The web-service decrypts the tokens before sending — the email-worker never touches the encryption key.

## Local development

### Prerequisites

- Python 3.12+, [uv](https://docs.astral.sh/uv/)
- PostgreSQL running locally (`docker compose up -d db` from repo root)
- Gmail OAuth access/refresh tokens (complete the OAuth flow via the frontend first)
- Gemini API key

### Setup

```bash
cd email-worker
cp .env.local.example .env.local   # fill in your values
uv sync --extra dev
```

`.env.local` keys:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jobhunt
DB_USER=jobhunt
DB_PASSWORD=jobhunt
GEMINI_API_KEY=your-key-here
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
```

Also set `EMAIL_WORKER_URL=http://localhost:8001` in `web-service/.env.local`.

### Run

```bash
uv run uvicorn main:app --port 8001 --reload
```

### Test

```bash
uv run pytest
```

### Manual smoke test

```bash
curl -X POST http://localhost:8001/sync \
  -H "Content-Type: application/json" \
  -d '{
    "sync_id": "00000000-0000-0000-0000-000000000001",
    "user_id": "00000000-0000-0000-0000-000000000002",
    "access_token": "your-access-token",
    "refresh_token": "your-refresh-token",
    "label": null
  }'
```

## Deployment

Deployed as a Render `pserv` (private service) — not internet-accessible. Reachable within Render's private network at `http://jobhunt-email-worker:8001`.

After first deploy, set `GEMINI_API_KEY` manually in the Render dashboard (Dashboard → `jobhunt-email-worker` → Environment). No new DB migration is needed — the `email_syncs` table was created in Phase 1 (V9 migration).

See the root `render.yaml` for the full service definition and `README.md` for complete environment variable documentation.

## LangChain pipeline

### FilterAgent (`chains/filter_agent.py`)

Uses Gemini 2.0 Flash with structured output (`is_job_related: bool, reason: str`). Returns `False` on any LLM error — safe default that avoids crashing the sync for a transient API issue.

### OrchestratorAgent (`chains/orchestrator_agent.py`)

Extracts `company`, `role`, `job_posting_url`, and `salary_range` from the email. Calls `add_application` with the result. Stubs for future tools are marked `# TODO Phase 2.x`.

### Tools (`chains/tools.py`)

`add_application(user_id, company, role, job_posting_url?, salary_range?)` — inserts into `applications` with `ON CONFLICT (user_id, job_posting_url) DO NOTHING` to avoid duplicates, then adds an `Applied` stage.

## Phase roadmap

| Phase | Tool | Description |
|:------|:-----|:------------|
| 2 (current) | `add_application` | Detect and record new job applications from Gmail |
| 2.x | `add_action_item` | Detect interview scheduling requests → create action items |
| 2.x | `add_application_stage` | Detect interview confirmations / rejections → add stages |
| 2.x | `update_application_stage` | Update existing stage dates and results |
