"""
Fetch the latest emails from a user's Gmail account.
Credentials are supplied directly (no interactive OAuth needed).
"""
from __future__ import annotations

import base64
import logging
from datetime import datetime

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from config import GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


def _build_service(access_token: str, refresh_token: str, token_expiry: str | None):
    expiry = None
    if token_expiry:
        try:
            dt = datetime.fromisoformat(token_expiry.replace("Z", "+00:00"))
            # google-auth compares expiry against datetime.utcnow() (offset-naive),
            # so we must strip tzinfo before passing it to Credentials.
            expiry = dt.replace(tzinfo=None)
        except ValueError:
            pass

    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GMAIL_CLIENT_ID,
        client_secret=GMAIL_CLIENT_SECRET,
        scopes=SCOPES,
        expiry=expiry,
    )
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())

    return build("gmail", "v1", credentials=creds, cache_discovery=False)


def _extract_body(payload: dict) -> str:
    """Recursively extract plain-text body from a message payload."""
    mime = payload.get("mimeType", "")
    if mime == "text/plain":
        data = payload.get("body", {}).get("data", "")
        return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="replace")
    for part in payload.get("parts", []):
        text = _extract_body(part)
        if text:
            return text
    return ""


def fetch_emails(
    access_token: str,
    refresh_token: str,
    token_expiry: str | None,
    label: str | None,
    after: datetime | None = None,
    max_results: int = 100,
) -> list[dict]:
    """
    Return up to max_results emails (newest first).
    Each dict: {id, subject, from_, date, body_text}
    """
    service = _build_service(access_token, refresh_token, token_expiry)

    query_args: dict = {"userId": "me", "maxResults": max_results}
    q_parts = []
    if label:
        q_parts.append(f"label:{label.replace(' ', '-')}")
    if after:
        q_parts.append(f"after:{int(after.timestamp())}")
    if q_parts:
        query_args["q"] = " ".join(q_parts)

    result = service.users().messages().list(**query_args).execute()
    message_refs = result.get("messages", [])

    emails = []
    for ref in message_refs:
        try:
            msg = (
                service.users()
                .messages()
                .get(userId="me", id=ref["id"], format="full")
                .execute()
            )
            headers = {
                h["name"].lower(): h["value"] for h in msg["payload"]["headers"]
            }
            emails.append(
                {
                    "id": ref["id"],
                    "subject": headers.get("subject", ""),
                    "from_": headers.get("from", ""),
                    "date": headers.get("date", ""),
                    "body_text": _extract_body(msg["payload"]),
                }
            )
        except Exception as exc:
            logger.warning("Failed to fetch message id=%s: %s", ref["id"], exc)

    return emails
