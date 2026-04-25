"""Tests for main.py — POST /sync endpoint."""
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from chains.email_parser_agent import ParsedEmail


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

_STRIPE_EMAIL = {
    "id": "1",
    "subject": "Thanks for applying to Stripe",
    "from_": "hr@stripe.com",
    "date": "Mon, 1 Jan 2024",
    "body_text": "We received your application.",
}
_NEWSLETTER_EMAIL = {
    "id": "2",
    "subject": "Newsletter: Python Weekly",
    "from_": "news@python.org",
    "date": "Mon, 1 Jan 2024",
    "body_text": "This week in Python...",
}


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_sync_happy_path(client):
    # Gmail returns newest-first; reversed() makes oldest first.
    # Stripe email is index 0 (oldest), newsletter is index 1 (newest).
    mock_emails = [_STRIPE_EMAIL, _NEWSLETTER_EMAIL]
    parsed = ParsedEmail(company="Stripe", role="Engineer", date="2024-01-01")
    app_summary = {"found": True, "app_id": "app-id-123", "stages": []}

    with (
        patch("main.fetch_emails", return_value=mock_emails) as mock_fetch,
        patch("main.is_job_related", side_effect=[False, True]) as mock_filter,
        patch("main.parse_email", return_value=parsed) as mock_parse,
        patch("main.find_app_id", return_value="app-id-123") as mock_finder,
        patch("main.get_application_summary_by_id", return_value=app_summary),
        patch("main.get_action_items", return_value=[]),
        patch("main.process_stages", return_value=1) as mock_stages,
        patch("main.process_action_items", return_value=0),
        patch("main.update_sync") as mock_update,
    ):
        resp = client.post("/sync", json=VALID_PAYLOAD)

    assert resp.status_code == 200
    body = resp.json()
    assert body["sync_id"] == VALID_PAYLOAD["sync_id"]
    assert body["emails_fetched"] == 2
    assert body["emails_processed"] == 1
    assert body["application_updates"] == 1

    mock_fetch.assert_called_once_with(
        access_token="tok-access",
        refresh_token="tok-refresh",
        token_expiry=None,
        label="jobs",
    )
    assert mock_filter.call_count == 2
    # reversed([Stripe, Newsletter]) = [Newsletter, Stripe]; Newsletter filtered out,
    # Stripe processed — parse_email called with the Stripe email
    mock_parse.assert_called_once_with(_STRIPE_EMAIL)
    mock_finder.assert_called_once_with(VALID_PAYLOAD["user_id"], parsed)
    mock_stages.assert_called_once_with("app-id-123", _STRIPE_EMAIL, app_summary)
    mock_update.assert_called_once()
    sync_update = mock_update.call_args[0][1]
    assert sync_update.status == "completed"
    assert sync_update.emails_fetched == 2
    assert sync_update.emails_processed == 1
    assert sync_update.application_updates == 1
    assert sync_update.error_message is None


def test_sync_no_app_id_creates_application(client):
    mock_emails = [_STRIPE_EMAIL]
    parsed = ParsedEmail(company="Stripe", role="Engineer", date="2024-01-01")
    app_summary = {"found": True, "app_id": "new-app-id", "stages": []}

    with (
        patch("main.fetch_emails", return_value=mock_emails),
        patch("main.is_job_related", return_value=True),
        patch("main.parse_email", return_value=parsed),
        patch("main.find_app_id", return_value=None),
        patch("main.add_application", return_value="new-app-id") as mock_create,
        patch("main.get_application_summary_by_id", return_value=app_summary),
        patch("main.get_action_items", return_value=[]),
        patch("main.process_stages", return_value=1),
        patch("main.process_action_items", return_value=0),
        patch("main.update_sync"),
    ):
        resp = client.post("/sync", json=VALID_PAYLOAD)

    assert resp.status_code == 200
    mock_create.assert_called_once_with(VALID_PAYLOAD["user_id"], "Stripe", "Engineer")


def test_sync_skips_email_when_no_company(client):
    mock_emails = [_STRIPE_EMAIL]
    parsed = ParsedEmail(company=None, role=None, date=None)

    with (
        patch("main.fetch_emails", return_value=mock_emails),
        patch("main.is_job_related", return_value=True),
        patch("main.parse_email", return_value=parsed),
        patch("main.find_app_id") as mock_finder,
        patch("main.update_sync"),
    ):
        resp = client.post("/sync", json=VALID_PAYLOAD)

    assert resp.status_code == 200
    assert resp.json()["emails_processed"] == 0
    mock_finder.assert_not_called()


def test_sync_skips_email_when_no_app_and_no_role(client):
    mock_emails = [_STRIPE_EMAIL]
    parsed = ParsedEmail(company="Stripe", role=None, date=None)

    with (
        patch("main.fetch_emails", return_value=mock_emails),
        patch("main.is_job_related", return_value=True),
        patch("main.parse_email", return_value=parsed),
        patch("main.find_app_id", return_value=None),
        patch("main.add_application") as mock_create,
        patch("main.update_sync"),
    ):
        resp = client.post("/sync", json=VALID_PAYLOAD)

    assert resp.status_code == 200
    assert resp.json()["emails_processed"] == 0
    mock_create.assert_not_called()


def test_sync_gmail_fetch_failure_returns_502(client):
    with (
        patch("main.fetch_emails", side_effect=Exception("Gmail API error")),
        patch("main.update_sync") as mock_update,
    ):
        resp = client.post("/sync", json=VALID_PAYLOAD)

    assert resp.status_code == 502
    mock_update.assert_called_once()
    sync_update = mock_update.call_args[0][1]
    assert sync_update.status == "failed"
    assert "Gmail API error" in sync_update.error_message


def test_sync_missing_required_field_returns_422(client):
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "sync_id"}
    resp = client.post("/sync", json=payload)
    assert resp.status_code == 422


def test_sync_processing_exception_still_completes(client):
    """A single email processing failure should not fail the entire sync."""
    mock_emails = [_STRIPE_EMAIL]

    with (
        patch("main.fetch_emails", return_value=mock_emails),
        patch("main.is_job_related", return_value=True),
        patch("main.parse_email", side_effect=Exception("LLM timeout")),
        patch("main.update_sync") as mock_update,
    ):
        resp = client.post("/sync", json=VALID_PAYLOAD)

    assert resp.status_code == 200
    body = resp.json()
    assert body["emails_processed"] == 0
    sync_update = mock_update.call_args[0][1]
    assert sync_update.status == "completed"
    assert sync_update.error_message is not None
