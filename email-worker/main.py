"""
FastAPI private service — email sync worker.
Called by the web-service POST /email-syncs endpoint.
"""

from __future__ import annotations

import logging
from datetime import timezone
from email.utils import parsedate_to_datetime

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from chains.filter_agent import is_job_related
from chains.processor_graph_agent import process_email
from db_client import SyncUpdate, update_sync
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


def _parse_email_date(date_str: str):
    if not date_str:
        return None
    try:
        return (
            parsedate_to_datetime(date_str)
            .astimezone(timezone.utc)
            .replace(tzinfo=None)
        )
    except Exception:
        return None


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
        update_sync(req.sync_id, SyncUpdate(status="failed", error_message=str(exc)))
        raise HTTPException(status_code=502, detail="Failed to fetch emails from Gmail")

    emails_fetched = len(emails)
    logger.info("run_sync: sync_id=%s fetched %d emails", req.sync_id, emails_fetched)

    emails_processed = 0
    errors = []
    # for email in reversed(emails):
    #    if not is_job_related(email):
    #        continue
    #    try:
    #        process_email(user_id=req.user_id, email=email)
    #        emails_processed += 1
    #    except Exception as exc:
    #        logger.warning("process_email failed subject=%r: %s", email.get("subject"), exc)
    #        errors.append(str(exc))

    # Gmail returns newest-first; oldest is last element, newest is first
    first_email_at = _parse_email_date(emails[-1].get("date", "")) if emails else None
    last_email_at = _parse_email_date(emails[0].get("date", "")) if emails else None
    update_sync(
        req.sync_id,
        SyncUpdate(
            status="completed",
            emails_fetched=emails_fetched,
            emails_processed=emails_processed,
            error_message="; ".join(errors[:5]) if errors else None,
            first_email_at=first_email_at,
            last_email_at=last_email_at,
        ),
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
