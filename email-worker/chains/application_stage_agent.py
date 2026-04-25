"""
ApplicationStageAgent: update application stage progression from a job email.
ReACT agent with two stage CRUD tools bound to a specific app_id.
"""

from __future__ import annotations

import logging
import os

from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent

from chains.tools import (
    add_application_stage_by_id as _add_stage,
)
from chains.tools import (
    update_application_stage_by_id as _update_stage,
)

logger = logging.getLogger(__name__)

_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    google_api_key=os.environ.get("GEMINI_API_KEY"),
    temperature=0,
)

_SYSTEM = """\
You are updating the stage history of a job application based on an email.

Rules:
- Only act when the email clearly signals a new stage or a stage outcome. \
Pleasantries, scheduling logistics, and general updates that do not change the \
application's funnel stage should be ignored — do nothing.
- add_application_stage: use for a NEW stage not yet in the existing stages list. \
Set result="Pending" unless the email states a pass/fail explicitly.
- update_application_stage: use to set result or stage_date on an EXISTING stage.
- If the stage already exists with the correct result, do nothing.

Scheduling rules:
- Email contains an explicit date → set stage_date (YYYY-MM-DD).
- "Round passed" with no date → update prior stage result=Passed and add the next stage with result=Pending.

Valid stage values: Referred, Applied, Recruiter Screen, Team Lead/Manager Screen, \
Technical Screen, System Design Interview, Onsite Interview, Offer, Rejected.
Valid result values: Pending, Passed, Failed.\
"""


def process_stages(
    app_id: str,
    email: dict,
    app_summary: dict,
) -> int:
    """
    Run the application stage agent for one email.
    Returns the number of successful tool calls made (for application_updates counter).
    """

    @tool
    def add_application_stage(
        stage: str, result: str | None = None, stage_date: str | None = None
    ) -> str:
        """Add a new stage to the application."""
        return _add_stage(app_id, stage, result, stage_date)

    @tool
    def update_application_stage(
        stage: str, result: str | None = None, stage_date: str | None = None
    ) -> str:
        """Update result or date on an existing stage."""
        return _update_stage(app_id, stage, result, stage_date)

    stages = app_summary.get("stages", [])
    stage_lines = (
        "\n".join(
            f"  - {s['stage']}: result={s['result']}, date={s['stage_date']}"
            for s in stages
        )
        if stages
        else "  (none yet)"
    )
    context = (
        f"=== EMAIL ===\n"
        f"Subject: {email.get('subject', '')}\n"
        f"From: {email.get('from_', '')}\n"
        f"Date: {email.get('date', '')}\n\n"
        f"{email.get('body_text', '')[:3000]}\n\n"
        f"=== EXISTING STAGES ===\n{stage_lines}"
    )

    agent = create_react_agent(
        _llm, [add_application_stage, update_application_stage], prompt=_SYSTEM
    )
    updates = 0
    try:
        result = agent.invoke({"messages": [{"role": "user", "content": context}]})
        for msg in result["messages"]:
            if hasattr(msg, "type") and msg.type == "tool":
                updates += 1
    except Exception as exc:
        logger.warning("process_stages failed app_id=%s: %s", app_id, exc)
    logger.info("process_stages: app_id=%s updates=%d", app_id, updates)
    return updates
