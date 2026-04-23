"""
FilterAgent: decide whether an email is job-application-related.
"""
from __future__ import annotations

import logging
import os

from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel

logger = logging.getLogger(__name__)

_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    google_api_key=os.environ.get("GEMINI_API_KEY"),
    temperature=0,
)


class _JobRelevance(BaseModel):
    is_job_related: bool
    reason: str


_filter_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You are an email classifier for a job hunt tracker.
Decide whether the following email is related to a job application process.
'Related' means it is about: applying for a job, an application acknowledgement,
a recruiter outreach, an interview invitation or confirmation, an offer letter,
a rejection, or any hiring process update.
Respond with is_job_related=true or false, and a brief reason.""",
        ),
        (
            "human",
            "Subject: {subject}\nFrom: {from_}",
        ),
    ]
)

_filter_chain = _filter_prompt | _llm.with_structured_output(_JobRelevance)


def is_job_related(email: dict) -> bool:
    """Return True if the email is about a job application."""
    try:
        result: _JobRelevance = _filter_chain.invoke(
            {
                "subject": email.get("subject", ""),
                "from_": email.get("from_", ""),
            }
        )
        logger.debug(
            "FilterAgent: subject=%r → is_job_related=%s reason=%s",
            email.get("subject"),
            result.is_job_related,
            result.reason,
        )
        return result.is_job_related
    except Exception as exc:
        logger.warning("FilterAgent failed for subject=%r: %s", email.get("subject"), exc)
        return False
