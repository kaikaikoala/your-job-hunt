"""Tests for chains/filter_agent.py — mock the LLM chain."""
from unittest.mock import MagicMock, patch


def _make_email(subject: str, from_: str = "hr@company.com", body: str = "") -> dict:
    return {"subject": subject, "from_": from_, "body_text": body}


def test_is_job_related_returns_true_for_job_email():
    mock_result = MagicMock()
    mock_result.is_job_related = True

    with patch("chains.filter_agent._filter_chain") as mock_chain:
        mock_chain.invoke.return_value = mock_result
        from chains.filter_agent import is_job_related

        assert is_job_related(_make_email("Thanks for applying to Stripe")) is True
        mock_chain.invoke.assert_called_once()


def test_is_job_related_returns_false_for_non_job_email():
    mock_result = MagicMock()
    mock_result.is_job_related = False

    with patch("chains.filter_agent._filter_chain") as mock_chain:
        mock_chain.invoke.return_value = mock_result
        from chains.filter_agent import is_job_related

        assert is_job_related(_make_email("Your Amazon order has shipped")) is False


def test_is_job_related_returns_false_on_llm_exception():
    with patch("chains.filter_agent._filter_chain") as mock_chain:
        mock_chain.invoke.side_effect = Exception("LLM unavailable")
        from chains.filter_agent import is_job_related

        result = is_job_related(_make_email("Some email"))
        assert result is False
