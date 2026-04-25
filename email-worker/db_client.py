from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timezone

from db import get_conn

logger = logging.getLogger(__name__)


@dataclass
class SyncUpdate:
    status: str
    emails_fetched: int | None = None
    emails_processed: int | None = None
    application_updates: int | None = None
    error_message: str | None = None
    first_email_at: datetime | None = None
    last_email_at: datetime | None = None


def update_sync(sync_id: str, update: SyncUpdate) -> None:
    sql = """
        UPDATE email_syncs
        SET status = %s,
            completed_at = %s,
            emails_fetched = %s,
            emails_processed = %s,
            application_updates = %s,
            error_message = %s,
            first_email_timestamp = %s,
            last_email_timestamp = %s
        WHERE sync_id = %s
    """
    params = (
        update.status,
        datetime.now(timezone.utc),
        update.emails_fetched,
        update.emails_processed,
        update.application_updates,
        update.error_message,
        update.first_email_at,
        update.last_email_at,
        sync_id,
    )
    logger.info(
        "update_sync: executing UPDATE for sync_id=%s params=%s",
        sync_id,
        params,
    )
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                logger.info(
                    "update_sync: rowcount=%d for sync_id=%s (0 means no row matched)",
                    cur.rowcount,
                    sync_id,
                )
            conn.commit()
            logger.info("update_sync: committed for sync_id=%s", sync_id)
    except Exception as exc:
        logger.error("Failed to update email_syncs row sync_id=%s: %s", sync_id, exc, exc_info=True)
        raise
