"""Tests for chains/processor_graph_agent.py."""
from unittest.mock import MagicMock, patch


def _make_email(subject: str, from_: str = "hr@company.com", body: str = "", date: str = "") -> dict:
    return {"subject": subject, "from_": from_, "body_text": body, "date": date}


# ---------------------------------------------------------------------------
# extract_entity node
# ---------------------------------------------------------------------------

def test_extract_entity_returns_company_and_role():
    mock_result = MagicMock()
    mock_result.company = "Stripe"
    mock_result.role = "Software Engineer"

    mock_structured_llm = MagicMock()
    mock_structured_llm.invoke.return_value = mock_result

    with patch("chains.processor_graph_agent._llm") as mock_llm:
        mock_llm.with_structured_output.return_value = mock_structured_llm
        from chains.processor_graph_agent import _extract_entity_node

        state = {"user_id": "u1", "email": _make_email("Thanks for applying to Stripe SWE"), "company": None, "role": None, "application_summary": None}
        result = _extract_entity_node(state)

    assert result == {"company": "Stripe", "role": "Software Engineer"}


def test_extract_entity_returns_none_when_llm_returns_none():
    mock_result = MagicMock()
    mock_result.company = None
    mock_result.role = None

    mock_structured_llm = MagicMock()
    mock_structured_llm.invoke.return_value = mock_result

    with patch("chains.processor_graph_agent._llm") as mock_llm:
        mock_llm.with_structured_output.return_value = mock_structured_llm
        from chains.processor_graph_agent import _extract_entity_node

        state = {"user_id": "u1", "email": _make_email("Hello!"), "company": None, "role": None, "application_summary": None}
        result = _extract_entity_node(state)

    assert result == {"company": None, "role": None}


# ---------------------------------------------------------------------------
# query_db node
# ---------------------------------------------------------------------------

def test_query_db_node_calls_get_application_summary():
    summary = {"found": True, "app_id": "abc-123", "stages": [{"stage": "Applied", "result": "Pending", "stage_date": None}]}
    with patch("chains.processor_graph_agent._get_application_summary", return_value=summary) as mock_fn:
        from chains.processor_graph_agent import _query_db_node

        state = {"user_id": "u1", "email": {}, "company": "Stripe", "role": "SWE", "application_summary": None}
        result = _query_db_node(state)

    mock_fn.assert_called_once_with("u1", "Stripe", "SWE")
    assert result == {"application_summary": summary}


# ---------------------------------------------------------------------------
# Routing
# ---------------------------------------------------------------------------

def test_route_after_extract_goes_to_query_db_when_both_present():
    from chains.processor_graph_agent import _route_after_extract

    state = {"user_id": "u1", "email": {}, "company": "Stripe", "role": "SWE", "application_summary": None}
    assert _route_after_extract(state) == "query_db"


def test_route_after_extract_ends_when_company_missing():
    from chains.processor_graph_agent import _route_after_extract
    from langgraph.graph import END

    state = {"user_id": "u1", "email": {}, "company": None, "role": "SWE", "application_summary": None}
    assert _route_after_extract(state) == END


def test_route_after_extract_ends_when_role_missing():
    from chains.processor_graph_agent import _route_after_extract
    from langgraph.graph import END

    state = {"user_id": "u1", "email": {}, "company": "Stripe", "role": None, "application_summary": None}
    assert _route_after_extract(state) == END


# ---------------------------------------------------------------------------
# act node
# ---------------------------------------------------------------------------

def test_act_node_does_not_raise_on_agent_exception():
    mock_agent = MagicMock()
    mock_agent.invoke.side_effect = Exception("LLM unavailable")

    with patch("chains.processor_graph_agent.create_react_agent", return_value=mock_agent):
        from chains.processor_graph_agent import _act_node

        state = {
            "user_id": "u1",
            "email": _make_email("Congrats, you passed!"),
            "company": "Stripe",
            "role": "SWE",
            "application_summary": {"found": True, "app_id": "abc", "stages": []},
        }
        result = _act_node(state)

    assert result == {}


def test_act_node_build_tools_binds_user_id():
    with patch("chains.processor_graph_agent._add_application") as mock_fn:
        from chains.processor_graph_agent import _build_tools

        tools = _build_tools("user-xyz")
        add_tool = next(t for t in tools if t.name == "add_application")
        add_tool.invoke({"company": "Stripe", "role": "SWE"})

    mock_fn.assert_called_once_with("user-xyz", "Stripe", "SWE", None, None)
