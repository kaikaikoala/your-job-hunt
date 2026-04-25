"""
ProcessorGraphAgent: LangGraph ReACT pipeline for email processing.

Graph: extract_entity → query_db → act
  extract_entity  structured LLM call: company + role from email
  query_db        pure Python DB read: current application state
  act             ReACT agent with full context (email + DB state) and all CRUD tools
"""

from __future__ import annotations

import logging
import os
from typing import TypedDict

from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, StateGraph
from langgraph.prebuilt import create_react_agent
from pydantic import BaseModel

from chains.tools import (
    add_application as _add_application,
)
from chains.tools import (
    add_application_stage as _add_application_stage,
)
from chains.tools import (
    get_application_summary as _get_application_summary,
)
from chains.tools import (
    update_application as _update_application,
)
from chains.tools import (
    update_application_stage as _update_application_stage,
)

logger = logging.getLogger(__name__)

_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    google_api_key=os.environ.get("GEMINI_API_KEY"),
    temperature=0,
)


# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------


class GraphState(TypedDict):
    user_id: str
    email: dict
    company: str | None
    role: str | None
    application_summary: dict | None


# ---------------------------------------------------------------------------
# Node 1: extract_entity
# ---------------------------------------------------------------------------


class _EntityExtraction(BaseModel):
    company: str | None = None
    role: str | None = None


_EXTRACT_SYSTEM = """\
Extract the company name and job role/title from this job-related email.
Return null for either field if you cannot determine it with confidence.\
"""


def _extract_entity_node(state: GraphState) -> dict:
    email = state["email"]
    text = (
        f"Subject: {email.get('subject', '')}\n"
        f"From: {email.get('from_', '')}\n\n"
        f"{email.get('body_text', '')[:2000]}"
    )
    structured_llm = _llm.with_structured_output(_EntityExtraction)
    result: _EntityExtraction = structured_llm.invoke(
        [
            {"role": "system", "content": _EXTRACT_SYSTEM},
            {"role": "user", "content": text},
        ]
    )
    logger.info("extract_entity: company=%r role=%r", result.company, result.role)
    return {"company": result.company, "role": result.role}


# ---------------------------------------------------------------------------
# Node 2: query_db
# ---------------------------------------------------------------------------


def _query_db_node(state: GraphState) -> dict:
    summary = _get_application_summary(
        state["user_id"], state["company"], state["role"]
    )
    logger.info(
        "query_db: found=%s stages=%d", summary["found"], len(summary["stages"])
    )
    return {"application_summary": summary}


# ---------------------------------------------------------------------------
# Node 3: act (ReACT agent)
# ---------------------------------------------------------------------------

_ACT_SYSTEM = """\
You are a job-hunt assistant. You have been given a job-related email and the current \
state of the matching application in the database.

Your job is to update the database only when the email contains a meaningful change to \
the application's status or metadata. Many emails are pleasantries, scheduling \
confirmations, or logistical messages that do not represent a new stage or outcome — \
do not call any tool for those. Only act when the email clearly implies a state change \
(new stage, stage outcome, or corrected metadata). If in doubt, do nothing.

Tool selection rules:
- add_application: use when found=false to create the application record. Follow \
 with add_application_stage to record the relevant stage implied by the email.
- add_application_stage: use to record a NEW stage that does not yet appear in the \
stage list. Set result="Pending" unless the email states a pass/fail outcome explicitly.
- update_application: use to correct the role or other application metadata (job_posting_url, \
salary_range) when the email provides more precise information than what was recorded. \
Looks up by company only, so it works even when the stored role is wrong or missing.
- update_application_stage: use to set result or stage_date on an EXISTING stage \
(interview confirmation, rejection received, moved-forward decision).

Scheduling rules:
- Email contains an explicit date AND time → set stage_date (YYYY-MM-DD) on the stage.
- "Round passed" email with no scheduled date → update prior stage result=Passed and \
add_application_stage for the next round with result=Pending.

Special cases:
- Rejection with no prior interview: add_application (if found=false) then \
add_application_stage with stage="Rejected", result="Failed".
- If company or role cannot be determined, do not call any tool.

Valid stage values: Referred, Applied, Recruiter Screen, Team Lead/Manager Screen, Technical Screen, System Design Interview, Onsite Interview, Offer, Rejected.
Valid result values: Pending, Passed, Failed.\
"""


def _format_context(state: GraphState) -> str:
    email = state["email"]
    summary = state["application_summary"]

    email_block = (
        f"Subject: {email.get('subject', '')}\n"
        f"From: {email.get('from_', '')}\n"
        f"Date: {email.get('date', '')}\n\n"
        f"{email.get('body_text', '')[:3000]}"
    )

    if summary and summary["found"]:
        stages = summary["stages"]
        stage_lines = (
            "\n".join(
                f"  - {s['stage']}: result={s['result']}, date={s['stage_date']}"
                for s in stages
            )
            if stages
            else "  (none)"
        )
        db_block = (
            f"Application found (app_id={summary['app_id']}):\n"
            f"Existing stages:\n{stage_lines}"
        )
    else:
        db_block = "No application found in the database for this company/role."

    return f"=== EMAIL ===\n{email_block}\n\n=== DATABASE STATE ===\n{db_block}"


def _build_tools(user_id: str) -> list:
    @tool
    def add_application(
        company: str,
        role: str,
        job_posting_url: str | None = None,
        salary_range: str | None = None,
    ) -> str:
        """Create a new application record when no application exists yet (found=false). Always follow with add_application_stage."""
        result = _add_application(user_id, company, role, job_posting_url, salary_range)
        return result or "Application already tracked or insert failed."

    @tool
    def add_application_stage(
        company: str,
        role: str,
        stage: str,
        result: str | None = None,
        stage_date: str | None = None,
    ) -> str:
        """Add a new stage to an existing application."""
        return _add_application_stage(user_id, company, role, stage, result, stage_date)

    @tool
    def update_application(
        company: str,
        role: str | None = None,
        job_posting_url: str | None = None,
        salary_range: str | None = None,
    ) -> str:
        """Correct the role or other metadata on an existing application. Looks up by company only."""
        return _update_application(user_id, company, role, job_posting_url, salary_range)

    @tool
    def update_application_stage(
        company: str,
        role: str,
        stage: str,
        result: str | None = None,
        stage_date: str | None = None,
    ) -> str:
        """Update the outcome or date of an existing stage."""
        return _update_application_stage(
            user_id, company, role, stage, result, stage_date
        )

    return [add_application, add_application_stage, update_application, update_application_stage]


def _act_node(state: GraphState) -> dict:
    tools = _build_tools(state["user_id"])
    agent = create_react_agent(_llm, tools, prompt=_ACT_SYSTEM)
    context = _format_context(state)
    try:
        agent.invoke({"messages": [{"role": "user", "content": context}]})
    except Exception as exc:
        logger.warning(
            "act_node failed for company=%r role=%r: %s",
            state.get("company"),
            state.get("role"),
            exc,
        )
    return {}


# ---------------------------------------------------------------------------
# Routing
# ---------------------------------------------------------------------------


def _route_after_extract(state: GraphState) -> str:
    if state.get("company") and state.get("role"):
        return "query_db"
    logger.warning("extract_entity: could not determine company/role — skipping")
    return END


# ---------------------------------------------------------------------------
# Graph assembly
# ---------------------------------------------------------------------------

_builder = StateGraph(GraphState)
_builder.add_node("extract_entity", _extract_entity_node)
_builder.add_node("query_db", _query_db_node)
_builder.add_node("act", _act_node)
_builder.set_entry_point("extract_entity")
_builder.add_conditional_edges(
    "extract_entity",
    _route_after_extract,
    {"query_db": "query_db", END: END},
)
_builder.add_edge("query_db", "act")
_builder.add_edge("act", END)
_graph = _builder.compile()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def process_email(user_id: str, email: dict) -> None:
    """Process a job-related email through the LangGraph pipeline."""
    subject = email.get("subject", "")
    logger.info("ProcessorGraphAgent: processing subject=%r", subject)
    _graph.invoke(
        {
            "user_id": user_id,
            "email": email,
            "company": None,
            "role": None,
            "application_summary": None,
        }
    )
