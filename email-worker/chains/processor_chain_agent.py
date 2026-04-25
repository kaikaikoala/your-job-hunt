"""
ProcessorChainAgent: understand email intent and call the right DB tool.
Single LLM call per email — routes to one of three CRUD tools.
"""
from __future__ import annotations

import logging
import os

from langchain.agents import create_agent
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI

from chains.tools import (
    add_application as _add_application,
    add_application_stage as _add_application_stage,
    update_application as _update_application,
    update_application_stage as _update_application_stage,
)

logger = logging.getLogger(__name__)

_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    google_api_key=os.environ.get("GEMINI_API_KEY"),
    temperature=0,
)

_SYSTEM_PROMPT = """\
You are a job-hunt assistant. Given a job-related email, extract the relevant information \
and call exactly one tool to record it.

Tool selection rules:
- add_application: the email is a first-time application receipt or acknowledgement \
(e.g. "Thank you for applying", "We received your application").
- add_application_stage: the email introduces a NEW stage on an existing application — \
interview scheduled, OA invitation, take-home sent, next-round invite. Set result="Pending".
- update_application_stage: the email updates the OUTCOME of an existing stage — \
rejection, moved-forward confirmation, interview date confirmed. \
Set result="Passed", "Failed", or add stage_date.

Special cases:
- Rejection email with no prior interview: call add_application_stage with stage="Rejected", result="Failed".
- If you cannot determine company or role, do not call any tool.
- stage_date format: YYYY-MM-DD. Only set if a specific date is mentioned.

Valid stage values: Applied, Phone Screen, Technical Interview, OA, Offer, Rejected.
Valid result values: Pending, Passed, Failed.\
"""


def _build_tools(user_id: str) -> list:
    @tool
    def add_application(
        company: str,
        role: str,
        job_posting_url: str | None = None,
        salary_range: str | None = None,
    ) -> str:
        """Record a new job application. Use when the email is an application receipt or acknowledgement."""
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
        """Add a new stage to an existing application. Use for interview invites, OA, next-round emails, or rejections."""
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
        """Update the outcome or date of an existing stage. Use for confirmed interview dates, rejection updates, or pass/fail decisions."""
        return _update_application_stage(user_id, company, role, stage, result, stage_date)

    return [add_application, add_application_stage, update_application, update_application_stage]


def process_email(user_id: str, email: dict) -> None:
    """Route a job-related email to the appropriate DB tool via a tool-calling agent."""
    subject = email.get("subject", "")
    logger.info("ProcessorChainAgent: processing subject=%r", subject)

    tools = _build_tools(user_id)
    agent = create_agent(_llm, tools, system_prompt=_SYSTEM_PROMPT)

    email_text = (
        f"Subject: {subject}\n"
        f"From: {email.get('from_', '')}\n\n"
        f"{email.get('body_text', '')[:3000]}"
    )

    try:
        agent.invoke({"messages": [{"role": "user", "content": email_text}]})
    except Exception as exc:
        logger.warning("ProcessorChainAgent failed for subject=%r: %s", subject, exc)
