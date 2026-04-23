"""Tests for main.py — POST /sync endpoint."""
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    with patch("db.get_pool", return_value=MagicMock()):
        from main import app
        yield TestClient(app)


VALID_PAYLOAD = {
    "sync_id": "aaaaaaaa-0000-0000-0000-000000000001",
    "user_id": "bbbbbbbb-0000-0000-0000-000000000002",
    "access_token": "tok-access",
    "refresh_token": "tok-refresh",
    "token_expiry": None,
    "label": "jobs",
}


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_sync_happy_path(client):
    mock_emails = [
        {
            "id": "1",
            "subject": "Thanks for applying to Stripe",
            "from_": "hr@stripe.com",
            "date": "Mon, 1 Jan 2024",
            "body_text": "We received your application.",
        },
        {
            "id": "2",
            "subject": "Newsletter: Python Weekly",
            "from_": "news@python.org",
            "date": "Mon, 1 Jan 2024",
            "body_text": "This week in Python...",
        },
    ]

    with (
        patch("main.fetch_emails", return_value=mock_emails) as mock_fetch,
        patch("main.is_job_related", side_effect=[True, False]) as mock_filter,
        patch("main.process_email") as mock_process,
        patch("main._update_sync") as mock_update,
    ):
        resp = client.post("/sync", json=VALID_PAYLOAD)

    assert resp.status_code == 200
    body = resp.json()
    assert body["sync_id"] == VALID_PAYLOAD["sync_id"]
    assert body["emails_fetched"] == 2
    assert body["emails_processed"] == 1

    mock_fetch.assert_called_once_with(
        access_token="tok-access",
        refresh_token="tok-refresh",
        token_expiry=None,
        label="jobs",
    )
    assert mock_filter.call_count == 2
    mock_process.assert_called_once_with(
        user_id=VALID_PAYLOAD["user_id"], email=mock_emails[0]
    )
    mock_update.assert_called_once_with(
        sync_id=VALID_PAYLOAD["sync_id"],
        status="completed",
        emails_fetched=2,
        emails_processed=1,
        error_message=None,
    )


def test_sync_gmail_fetch_failure_returns_502(client):
    with (
        patch("main.fetch_emails", side_effect=Exception("Gmail API error")),
        patch("main._update_sync") as mock_update,
    ):
        resp = client.post("/sync", json=VALID_PAYLOAD)

    assert resp.status_code == 502
    mock_update.assert_called_once()
    call_kwargs = mock_update.call_args.kwargs
    assert call_kwargs["status"] == "failed"
    assert "Gmail API error" in call_kwargs["error_message"]


def test_sync_missing_required_field_returns_422(client):
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "sync_id"}
    resp = client.post("/sync", json=payload)
    assert resp.status_code == 422


def test_sync_process_email_exception_still_completes(client):
    """A single email processing failure should not fail the entire sync."""
    mock_emails = [
        {
            "id": "1",
            "subject": "Thanks for applying",
            "from_": "hr@co.com",
            "date": "Mon",
            "body_text": "...",
        }
    ]

    with (
        patch("main.fetch_emails", return_value=mock_emails),
        patch("main.is_job_related", return_value=True),
        patch("main.process_email", side_effect=Exception("LLM timeout")),
        patch("main._update_sync") as mock_update,
    ):
        resp = client.post("/sync", json=VALID_PAYLOAD)

    assert resp.status_code == 200
    body = resp.json()
    assert body["emails_processed"] == 0
    call_kwargs = mock_update.call_args.kwargs
    assert call_kwargs["status"] == "completed"
    assert call_kwargs["error_message"] is not None
