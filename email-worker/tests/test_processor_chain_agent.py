"""Tests for chains/processor_chain_agent.py — mock create_agent graph."""
from unittest.mock import MagicMock, patch


def _make_email(subject: str, from_: str = "hr@company.com", body: str = "") -> dict:
    return {"subject": subject, "from_": from_, "body_text": body}


def test_process_email_invokes_agent():
    mock_graph = MagicMock()
    with patch("chains.processor_chain_agent.create_agent", return_value=mock_graph):
        from chains.processor_chain_agent import process_email

        process_email("user-123", _make_email("Thanks for applying to Stripe SWE"))

    mock_graph.invoke.assert_called_once()
    messages = mock_graph.invoke.call_args[0][0]["messages"]
    assert any("Stripe" in str(m) for m in messages)


def test_process_email_does_not_raise_on_agent_exception():
    mock_graph = MagicMock()
    mock_graph.invoke.side_effect = Exception("LLM unavailable")
    with patch("chains.processor_chain_agent.create_agent", return_value=mock_graph):
        from chains.processor_chain_agent import process_email

        process_email("user-123", _make_email("Some email"))


def test_build_tools_returns_three_tools():
    from chains.processor_chain_agent import _build_tools

    tools = _build_tools("user-123")

    assert len(tools) == 4
    tool_names = {t.name for t in tools}
    assert tool_names == {"add_application", "add_application_stage", "update_application", "update_application_stage"}


def test_build_tools_add_application_binds_user_id():
    with patch("chains.processor_chain_agent._add_application") as mock_fn:
        from chains.processor_chain_agent import _build_tools

        tools = _build_tools("user-abc")
        add_app_tool = next(t for t in tools if t.name == "add_application")
        add_app_tool.invoke({"company": "Stripe", "role": "SWE"})

    mock_fn.assert_called_once_with("user-abc", "Stripe", "SWE", None, None)


def test_build_tools_add_stage_binds_user_id():
    with patch("chains.processor_chain_agent._add_application_stage") as mock_fn:
        from chains.processor_chain_agent import _build_tools

        tools = _build_tools("user-abc")
        stage_tool = next(t for t in tools if t.name == "add_application_stage")
        stage_tool.invoke({"company": "Stripe", "role": "SWE", "stage": "Phone Screen"})

    mock_fn.assert_called_once_with("user-abc", "Stripe", "SWE", "Phone Screen", None, None)


def test_build_tools_update_stage_binds_user_id():
    with patch("chains.processor_chain_agent._update_application_stage") as mock_fn:
        from chains.processor_chain_agent import _build_tools

        tools = _build_tools("user-abc")
        update_tool = next(t for t in tools if t.name == "update_application_stage")
        update_tool.invoke(
            {"company": "Stripe", "role": "SWE", "stage": "Phone Screen", "result": "Passed"}
        )

    mock_fn.assert_called_once_with("user-abc", "Stripe", "SWE", "Phone Screen", "Passed", None)
