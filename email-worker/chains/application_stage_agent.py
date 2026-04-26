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
    model="gemini-2.5-flash",
    google_api_key=os.environ.get("GEMINI_API_KEY"),
    temperature=0,
)

_SYSTEM = """\
Your task is to ensure the application funnel is consistent with the email.

RULES:
0. PRE-FILTER: Only act when the email clearly signals a new stage or update to an EXISTING STAGE. Pleasantries, account
OTP codes, etc. do not change the application funnel and should be ignored.
1. Identify NEXT and/or EXISTING stage(s) in the email. NEXT not in EXISTING STAGES.
2. To get stage_name follow this Waterfall Search Order:
    STEP A (preferred names). PREFERRED STAGE NAMES = [Referred, Applied, Recruiter Screen, Team Lead/Manager Screen, Technical Screen,
    System Design Interview, Onsite Interview, Offer, Rejected]
    STEP B (existing context). Reuse a stage name already listed in EXISTING STAGES.
    STEP C (fallback). FALLBACK STAGE NAMES = [Interview, Screening]
3. Use 'add_application_stage' for a NEXT stage not in EXISTING STAGES.
4. Use 'update_application_stage' to set result, stage_date or existing_stage_name on an EXISTING STAGE.

EXAMPLES:
   - CALENDAR INVITE: Update the EXISTING STAGE stage_date only. Do not change the result or existing_stage_name.
   - IF PASSED: Set the EXISTING STAGE result="Passed". If the email mentions a NEXT stage, add it with result="Pending".
   Example: "Good feedback on your interview today, Please forward your availability for the System Design Interview"
   - IF REJECTED: Set EXISTING Stage result="Failed". Add the NEXT stage "Rejected" with a stage_date 1 week in the future.
   Example: "Sorry, we will move forward with other applicants"
   - IF APPLIED: Set the EXISTING STAGE result="Applied". Example: "Thanks for applying"

STRICT CONSTRAINTS:
- Never create a duplicate stage. If a NEXT stage_name already exists in 'existing_stage_name', do not call
  'add_application_stage' for it — take no action for that stage.
- Avoid having multiple of the same stage_date - this is likely a duplicate and should be avoided.

VALID_STAGE_NAMES = [
    "Referred",
    "Applied",
    "Recruiter Screen",
    "Team Lead/Manager Screen",
    "Technical Screen",
    "System Design Interview",
    "Onsite Interview",
    "Offer",
    "Rejected",
    "Interview",
    "Screening",
]

VALID RESULT VALUES:
Pending, Passed, Failed.
"""


def process_stages(
    app_id: str,
    email: dict,
    app_summary: dict,
) -> int:
    """
    Run the application stage agent for one email.
    Returns the number of tool calls made (for application_updates counter).
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
