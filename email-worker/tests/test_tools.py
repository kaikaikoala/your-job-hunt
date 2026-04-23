"""Tests for chains/tools.py — mock psycopg2 connection pool."""
from contextlib import contextmanager
from unittest.mock import MagicMock, patch


def _make_mock_conn(fetchone_return):
    mock_cur = MagicMock()
    mock_cur.fetchone.return_value = fetchone_return
    mock_cur.__enter__ = lambda s: s
    mock_cur.__exit__ = MagicMock(return_value=False)

    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cur
    return mock_conn, mock_cur


def _make_mock_conn_multi(side_effects):
    """Build a mock connection whose fetchone returns values in sequence."""
    mock_cur = MagicMock()
    mock_cur.fetchone.side_effect = side_effects
    mock_cur.__enter__ = lambda s: s
    mock_cur.__exit__ = MagicMock(return_value=False)

    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cur
    return mock_conn, mock_cur


def test_add_application_inserts_and_returns_app_id():
    # fetchone sequence: None (no company+role dup), then app_id (INSERT RETURNING), then no more calls
    mock_conn, mock_cur = _make_mock_conn_multi(
        [None, ("aaaaaaaa-0000-0000-0000-000000000001",)]
    )

    @contextmanager
    def fake_get_conn():
        yield mock_conn

    with patch("chains.tools.get_conn", fake_get_conn):
        from chains.tools import add_application

        result = add_application(
            user_id="user-123",
            company="Stripe",
            role="Engineer",
            job_posting_url="https://stripe.com/jobs/1",
        )

    assert result == "aaaaaaaa-0000-0000-0000-000000000001"
    assert mock_cur.execute.call_count == 3  # check dup, INSERT app, INSERT stage
    insert_app_sql = mock_cur.execute.call_args_list[1][0][0]
    assert "INSERT INTO applications" in insert_app_sql
    insert_stage_sql = mock_cur.execute.call_args_list[2][0][0]
    assert "INSERT INTO application_stage" in insert_stage_sql
    mock_conn.commit.assert_called_once()


def test_add_application_returns_none_on_conflict():
    # fetchone sequence: None (no company+role dup), then None (url conflict from INSERT RETURNING)
    mock_conn, mock_cur = _make_mock_conn_multi([None, None])

    @contextmanager
    def fake_get_conn():
        yield mock_conn

    with patch("chains.tools.get_conn", fake_get_conn):
        from chains.tools import add_application

        result = add_application(
            user_id="user-123",
            company="Stripe",
            role="Engineer",
            job_posting_url="https://stripe.com/jobs/1",
        )

    assert result is None
    assert mock_cur.execute.call_count == 2  # check dup + INSERT (which conflicts)


def test_add_application_returns_none_on_db_error():
    mock_conn = MagicMock()
    mock_conn.cursor.side_effect = Exception("DB connection lost")

    @contextmanager
    def fake_get_conn():
        yield mock_conn

    with patch("chains.tools.get_conn", fake_get_conn):
        from chains.tools import add_application

        result = add_application(user_id="u", company="Co", role="Dev")

    assert result is None


# --- add_application_stage ---

def test_add_application_stage_inserts_and_returns_message():
    app_id = ("aaaaaaaa-0000-0000-0000-000000000001",)
    mock_conn, mock_cur = _make_mock_conn(app_id)

    @contextmanager
    def fake_get_conn():
        yield mock_conn

    with patch("chains.tools.get_conn", fake_get_conn):
        from chains.tools import add_application_stage

        result = add_application_stage(
            user_id="user-123",
            company="Stripe",
            role="Engineer",
            stage="Phone Screen",
            result="Pending",
            stage_date="2026-04-25",
        )

    assert "Phone Screen" in result
    assert mock_cur.execute.call_count == 2
    assert "INSERT INTO application_stage" in mock_cur.execute.call_args_list[1][0][0]
    mock_conn.commit.assert_called_once()


def test_add_application_stage_returns_message_when_app_not_found():
    mock_conn, mock_cur = _make_mock_conn(None)

    @contextmanager
    def fake_get_conn():
        yield mock_conn

    with patch("chains.tools.get_conn", fake_get_conn):
        from chains.tools import add_application_stage

        result = add_application_stage(
            user_id="user-123", company="Unknown Co", role="SWE", stage="Rejected"
        )

    assert "No application found" in result
    assert mock_cur.execute.call_count == 1
    mock_conn.commit.assert_not_called()


def test_add_application_stage_returns_error_on_db_exception():
    mock_conn = MagicMock()
    mock_conn.cursor.side_effect = Exception("DB down")

    @contextmanager
    def fake_get_conn():
        yield mock_conn

    with patch("chains.tools.get_conn", fake_get_conn):
        from chains.tools import add_application_stage

        result = add_application_stage(user_id="u", company="Co", role="Dev", stage="OA")

    assert "Error" in result


# --- update_application_stage ---

def test_update_application_stage_updates_and_returns_message():
    app_id = ("aaaaaaaa-0000-0000-0000-000000000001",)
    stage_id = ("bbbbbbbb-0000-0000-0000-000000000002",)
    mock_conn, mock_cur = _make_mock_conn_multi([app_id, stage_id])

    @contextmanager
    def fake_get_conn():
        yield mock_conn

    with patch("chains.tools.get_conn", fake_get_conn):
        from chains.tools import update_application_stage

        result = update_application_stage(
            user_id="user-123",
            company="Stripe",
            role="Engineer",
            stage="Phone Screen",
            result="Passed",
        )

    assert "Phone Screen" in result
    assert mock_cur.execute.call_count == 3
    assert "UPDATE application_stage" in mock_cur.execute.call_args_list[2][0][0]
    mock_conn.commit.assert_called_once()


def test_update_application_stage_returns_message_when_app_not_found():
    mock_conn, mock_cur = _make_mock_conn_multi([None])

    @contextmanager
    def fake_get_conn():
        yield mock_conn

    with patch("chains.tools.get_conn", fake_get_conn):
        from chains.tools import update_application_stage

        result = update_application_stage(
            user_id="u", company="Unknown", role="Dev", stage="Phone Screen"
        )

    assert "No application found" in result
    mock_conn.commit.assert_not_called()


def test_update_application_stage_returns_message_when_stage_not_found():
    app_id = ("aaaaaaaa-0000-0000-0000-000000000001",)
    mock_conn, mock_cur = _make_mock_conn_multi([app_id, None])

    @contextmanager
    def fake_get_conn():
        yield mock_conn

    with patch("chains.tools.get_conn", fake_get_conn):
        from chains.tools import update_application_stage

        result = update_application_stage(
            user_id="u", company="Stripe", role="Engineer", stage="Offer"
        )

    assert "No stage" in result
    mock_conn.commit.assert_not_called()
