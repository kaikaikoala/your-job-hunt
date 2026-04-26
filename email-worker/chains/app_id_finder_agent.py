"""
AppIdFinderAgent: determine which tracked application an email belongs to.
ReACT agent with two read-only DB tools.
"""
from __future__ import annotations

import logging
import os

from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent
from pydantic import BaseModel

from chains.email_parser_agent import ParsedEmail
from chains.tools import (
    get_application as _get_application,
    get_application_stages as _get_application_stages,
)

logger = logging.getLogger(__name__)

_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    google_api_key=os.environ.get("GEMINI_API_KEY"),
    temperature=0,
)

_SYSTEM = """\
You are finding which tracked job application an email belongs to.

Steps:
1. If a role was extracted, call get_application with the company and role for an exact match.
2. If no exact match (or no role was provided), call get_application_stages with the company \
to get all applications for that company.
3. If multiple applications exist, use the email date and the stage history of each application \
to identify the most recently active one closest to the email date.
4. If no applications exist for this company at all, conclude that no app_id exists.

Set app_id to the UUID string of the matched application, or null if no match was found.\
"""


class _AppIdResult(BaseModel):
    app_id: str | None = None  # UUID of the matching application, or null if not found


def find_app_id(user_id: str, parsed: ParsedEmail) -> str | None:
    """Return the app_id for the application this email belongs to, or None."""
    if not parsed.company:
        return None

    @tool
    def get_application(company: str, role: str) -> str:
        """Look up an application by exact company and role name."""
        result = _get_application(user_id, company, role)
        return result or "No application found"

    @tool
    def get_application_stages(company: str) -> list:
        """Get all applications and their stage history for a company."""
        return _get_application_stages(user_id, company)

    context = (
        f"Company: {parsed.company}\n"
        f"Role: {parsed.role or '(not specified)'}\n"
        f"Email date: {parsed.date or '(unknown)'}"
    )

    agent = create_react_agent(
        _llm,
        [get_application, get_application_stages],
        prompt=_SYSTEM,
        response_format=_AppIdResult,
    )
    try:
        result = agent.invoke({"messages": [{"role": "user", "content": context}]})
        structured: _AppIdResult = result["structured_response"]
        app_id = structured.app_id
        if not app_id:
            logger.info("find_app_id: no app found for company=%r", parsed.company)
            return None
        logger.info("find_app_id: app_id=%s for company=%r", app_id, parsed.company)
        return app_id
    except Exception as exc:
        logger.error("find_app_id failed: %s", exc)
        return None
