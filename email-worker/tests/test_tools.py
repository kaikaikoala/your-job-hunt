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


def test_add_application_inserts_and_returns_app_id():
    mock_conn, mock_cur = _make_mock_conn(("aaaaaaaa-0000-0000-0000-000000000001",))

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
    assert mock_cur.execute.call_count == 2
    first_sql = mock_cur.execute.call_args_list[0][0][0]
    assert "INSERT INTO applications" in first_sql
    second_sql = mock_cur.execute.call_args_list[1][0][0]
    assert "INSERT INTO application_stage" in second_sql
    mock_conn.commit.assert_called_once()


def test_add_application_returns_none_on_conflict():
    mock_conn, mock_cur = _make_mock_conn(None)

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
    assert mock_cur.execute.call_count == 1


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
