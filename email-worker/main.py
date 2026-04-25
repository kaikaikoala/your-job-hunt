"""
FastAPI private service — email sync worker.
Called by the web-service POST /email-syncs endpoint.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from chains.filter_agent import is_job_related
from chains.processor_graph_agent import process_email
from db import get_conn
from gmail_client import fetch_emails

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="email-worker", docs_url=None, redoc_url=None)


class SyncRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    sync_id: str
    user_id: str
    access_token: str
    refresh_token: str
    token_expiry: str | None = None
    label: str | None = None


def _update_sync(
    sync_id: str,
    status: str,
    emails_fetched: int | None = None,
    emails_processed: int | None = None,
    error_message: str | None = None,
) -> None:
    sql = """
        UPDATE email_syncs
        SET status = %s,
            completed_at = %s,
            emails_fetched = %s,
            emails_processed = %s,
            error_message = %s
        WHERE sync_id = %s
    """
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    sql,
                    (
                        status,
                        datetime.now(timezone.utc),
                        emails_fetched,
                        emails_processed,
                        error_message,
                        sync_id,
                    ),
                )
            conn.commit()
    except Exception as exc:
        logger.error("Failed to update email_syncs row sync_id=%s: %s", sync_id, exc)


@app.post("/sync", status_code=200)
def run_sync(req: SyncRequest):
    """
    Entry point called by web-service after it creates the email_syncs row.
    Fetches, filters, and processes emails then updates the sync status.
    """
    logger.info("run_sync: sync_id=%s user_id=%s", req.sync_id, req.user_id)

    try:
        emails = fetch_emails(
            access_token=req.access_token,
            refresh_token=req.refresh_token,
            token_expiry=req.token_expiry,
            label=req.label,
        )
    except Exception as exc:
        logger.error("fetch_emails failed for sync_id=%s: %s", req.sync_id, exc)
        _update_sync(req.sync_id, status="failed", error_message=str(exc))
        raise HTTPException(status_code=502, detail="Failed to fetch emails from Gmail")

    emails_fetched = len(emails)
    logger.info("run_sync: sync_id=%s fetched %d emails", req.sync_id, emails_fetched)

    emails_processed = 0
    errors = []
    for email in reversed(emails):
        if not is_job_related(email):
            continue
        try:
            process_email(user_id=req.user_id, email=email)
            emails_processed += 1
        except Exception as exc:
            logger.warning("process_email failed subject=%r: %s", email.get("subject"), exc)
            errors.append(str(exc))

    error_message = "; ".join(errors[:5]) if errors else None
    _update_sync(
        sync_id=req.sync_id,
        status="completed",
        emails_fetched=emails_fetched,
        emails_processed=emails_processed,
        error_message=error_message,
    )

    logger.info(
        "run_sync: sync_id=%s completed fetched=%d processed=%d",
        req.sync_id,
        emails_fetched,
        emails_processed,
    )
    return {
        "sync_id": req.sync_id,
        "emails_fetched": emails_fetched,
        "emails_processed": emails_processed,
    }


@app.get("/health")
def health():
    return {"status": "ok"}
