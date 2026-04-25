"""
ActionItemAgent: manage applicant action items derived from a job email.
ReACT agent with two action item CRUD tools bound to user_id + app_id.
"""
from __future__ import annotations

import logging
import os

from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent

from chains.tools import (
    add_action_item as _add_action_item,
    update_action_item as _update_action_item,
)

logger = logging.getLogger(__name__)

_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    google_api_key=os.environ.get("GEMINI_API_KEY"),
    temperature=0,
)

_SYSTEM = """\
You are managing action items for a job applicant based on an email.

Action items are tasks the applicant must personally complete or attend.

Add an action item when the email requires the applicant to:
- Schedule an interview ("please find a time", "book a slot")
- Complete a take-home assignment or coding challenge
- Attend an upcoming interview or onsite

Update an action item when the email indicates one is resolved:
- The applicant has scheduled the interview (reschedule counts as update)
- The interview has been attended ("thanks for coming in", "thanks for attending")
- An assignment has been submitted

If the email is a general update, rejection, offer letter, or pleasantry with no \
required applicant action, do nothing.
If an action item already exists and is already in the correct state, do nothing.

Action item status values: open, closed.\
"""


def process_action_items(
    user_id: str,
    app_id: str,
    email: dict,
    action_items: list[dict],
) -> int:
    """
    Run the action item agent for one email.
    Returns the number of successful tool calls made (for application_updates counter).
    """
    @tool
    def add_action_item(description: str, due_date: str | None = None) -> str:
        """Add a new action item for the applicant. due_date format: YYYY-MM-DD."""
        return _add_action_item(user_id, app_id, description, due_date)

    @tool
    def update_action_item(action_item_id: str, status: str | None = None, due_date: str | None = None) -> str:
        """Update the status or due date of an existing action item."""
        return _update_action_item(action_item_id, status=status, due_date=due_date)

    items_lines = (
        "\n".join(
            f"  - [{item['action_item_id']}] {item['description']} "
            f"(status={item['status']}, due={item['due_date']})"
            for item in action_items
        )
        if action_items
        else "  (none)"
    )
    context = (
        f"=== EMAIL ===\n"
        f"Subject: {email.get('subject', '')}\n"
        f"From: {email.get('from_', '')}\n"
        f"Date: {email.get('date', '')}\n\n"
        f"{email.get('body_text', '')[:3000]}\n\n"
        f"=== EXISTING ACTION ITEMS ===\n{items_lines}"
    )

    agent = create_react_agent(_llm, [add_action_item, update_action_item], prompt=_SYSTEM)
    updates = 0
    try:
        result = agent.invoke({"messages": [{"role": "user", "content": context}]})
        for msg in result["messages"]:
            if hasattr(msg, "type") and msg.type == "tool":
                updates += 1
    except Exception as exc:
        logger.warning("process_action_items failed app_id=%s: %s", app_id, exc)
    logger.info("process_action_items: app_id=%s updates=%d", app_id, updates)
    return updates
