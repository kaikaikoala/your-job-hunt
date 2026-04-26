"""
EmailParserAgent: extract structured fields from a job-related email.
Single structured LLM call — no tools.
"""

from __future__ import annotations

import logging
import os

from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel

logger = logging.getLogger(__name__)

_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    google_api_key=os.environ.get("GEMINI_API_KEY"),
    temperature=0,
)

_SYSTEM = """\
Extract structured information from this job-related email.

Rules:
- company: infer from the sender email domain or email body. Use the company's common name \
(e.g. "Stripe" not "stripe.com"). Return null if uncertain.
- role: extract the job title only if it is explicitly stated in the email body or subject. \
Do NOT guess or infer — return null if the role is not clearly mentioned.
- date: extract the most relevant date mentioned in the body (e.g. interview date, \
deadline). Format as YYYY-MM-DD.
- job_posting_url: extract any URL that links directly to the job posting or job description. \
Return null if none is present.
- salary_range: extract any salary or compensation range mentioned (e.g. "$120k–$150k", \
"£60,000"). Return null if not mentioned. \
"""


class ParsedEmail(BaseModel):
    company: str | None = None
    role: str | None = None
    date: str | None = None
    job_posting_url: str | None = None
    salary_range: str | None = None


def parse_email(email: dict) -> ParsedEmail:
    """Extract company, role, and date from a job-related email."""
    text = (
        f"Subject: {email.get('subject', '')}\n"
        f"From: {email.get('from_', '')}\n"
        f"Date received: {email.get('date', '')}\n\n"
        f"{email.get('body_text', '')[:3000]}"
    )
    structured_llm = _llm.with_structured_output(ParsedEmail)
    try:
        result: ParsedEmail = structured_llm.invoke(
            [
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": text},
            ]
        )
    except Exception as exc:
        logger.error("parse_email failed: %s", exc)
        return ParsedEmail()
    logger.info(
        "parse_email: company=%r role=%r date=%r job_posting_url=%r salary_range=%r",
        result.company,
        result.role,
        result.date,
        result.job_posting_url,
        result.salary_range,
    )
    return result
