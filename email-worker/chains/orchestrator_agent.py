"""
OrchestratorAgent: classify a job-related email and call the right tool.
"""
from __future__ import annotations

import logging
import os

from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel

from chains.tools import add_application

logger = logging.getLogger(__name__)

_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    google_api_key=os.environ.get("GEMINI_API_KEY"),
    temperature=0,
)


class _ApplicationExtraction(BaseModel):
    company: str
    role: str
    job_posting_url: str | None = None
    salary_range: str | None = None


_extract_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """Extract job application details from this email.
Fields:
- company: the company name (required)
- role: the job title or role (required; use 'Unknown' if not mentioned)
- job_posting_url: URL to the job posting if present, else null
- salary_range: salary range as a plain string if mentioned, else null""",
        ),
        (
            "human",
            "Subject: {subject}\nFrom: {from_}\n\n{body_text}",
        ),
    ]
)

_extract_chain = _extract_prompt | _llm.with_structured_output(_ApplicationExtraction)


def process_email(user_id: str, email: dict) -> None:
    """
    Extract application fields from a job-related email and write to the DB.
    # TODO Phase 2.x: add_action_item, add_application_stage, update_application_stage
    """
    subject = email.get("subject", "")
    logger.info("OrchestratorAgent: processing subject=%r", subject)

    try:
        extraction: _ApplicationExtraction = _extract_chain.invoke(
            {
                "subject": subject,
                "from_": email.get("from_", ""),
                "body_text": email.get("body_text", "")[:3000],
            }
        )
    except Exception as exc:
        logger.warning("Extraction failed for subject=%r: %s", subject, exc)
        return

    add_application(
        user_id=user_id,
        company=extraction.company,
        role=extraction.role,
        job_posting_url=extraction.job_posting_url,
        salary_range=extraction.salary_range,
    )
