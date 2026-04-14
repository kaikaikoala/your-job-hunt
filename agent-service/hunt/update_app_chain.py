"""
LangChain LCEL routing chain for hunt application updates.

Architecture:
  IntentRouter  →  {UPDATE_METADATA, ADD_STAGE, UPDATE_STAGE}
    → Worker    →  {SuccessNode, FailureNode}
                   → human-friendly string response

Input dict:  {"app_id": str, "message": str, "uid": str, "token": str}
Output:      str
"""

from __future__ import annotations

import os
from datetime import date
from enum import Enum
from typing import Any

import httpx
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableBranch, RunnableLambda
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Shared LLM
# ---------------------------------------------------------------------------

_llm = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview",
    google_api_key=os.environ.get("GEMINI_API_KEY"),
    temperature=0,
)


# ---------------------------------------------------------------------------
# Intent Router
# ---------------------------------------------------------------------------


class Intent(str, Enum):
    UPDATE_METADATA = "UPDATE_METADATA"
    ADD_STAGE = "ADD_STAGE"
    UPDATE_STAGE = "UPDATE_STAGE"


class IntentClassification(BaseModel):
    intent: Intent


_intent_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You are an intent classifier for a job application tracker.
Classify the user's message into exactly one of:
- UPDATE_METADATA: update basic application info (company name, job title/role, salary, job posting URL)
- ADD_STAGE: record a NEW stage/event on the application (phone screen, technical interview, offer, rejection, etc.)
- UPDATE_STAGE: modify an EXISTING stage that was already recorded (change its date or result)

Respond with just the intent classification.""",
        ),
        ("human", "{message}"),
    ]
)

_intent_chain = _intent_prompt | _llm.with_structured_output(IntentClassification)


def _classify_intent(inputs: dict) -> dict:
    result: IntentClassification = _intent_chain.invoke({"message": inputs["message"]})
    return {**inputs, "intent": result.intent}


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------


def _headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def _base_url() -> str:
    return os.environ.get("WEB_SERVICE_URL", "http://localhost:8080")


# ---------------------------------------------------------------------------
# MetadataWorker  (UPDATE_METADATA)
# ---------------------------------------------------------------------------


class MetadataExtraction(BaseModel):
    company: str | None = None
    role: str | None = None
    jobPostingUrl: str | None = None
    salaryRange: str | None = None


_metadata_extract_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """Extract job application metadata from the user's message.
Only populate fields that are explicitly mentioned; leave everything else null.
Fields:
- company: company name
- role: job title / role name
- jobPostingUrl: job posting URL
- salaryRange: salary as a plain string (e.g. "120k-140k")""",
        ),
        ("human", "{message}"),
    ]
)

_metadata_extract_chain = _metadata_extract_prompt | _llm.with_structured_output(
    MetadataExtraction
)


def _metadata_worker(inputs: dict) -> dict:
    extraction: MetadataExtraction = _metadata_extract_chain.invoke(
        {"message": inputs["message"]}
    )
    payload = {k: v for k, v in extraction.model_dump().items() if v is not None}

    if not payload:
        return {
            **inputs,
            "success": False,
            "error": "no_fields_extracted",
            "changed": {},
        }

    try:
        resp = httpx.patch(
            f"{_base_url()}/applications/{inputs['app_id']}",
            json=payload,
            headers=_headers(inputs["token"]),
            timeout=10.0,
        )
        if resp.status_code == 200:
            return {**inputs, "success": True, "changed": payload}
        return {
            **inputs,
            "success": False,
            "error": f"api_{resp.status_code}",
            "changed": {},
        }
    except Exception as exc:
        return {**inputs, "success": False, "error": str(exc), "changed": {}}


# ---------------------------------------------------------------------------
# AddStageWorker  (ADD_STAGE)
# ---------------------------------------------------------------------------


class StageExtraction(BaseModel):
    stage: str
    stageDate: str
    result: str | None = None


_add_stage_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """Extract application stage info from the user's message.
- stage: stage type in UPPER_SNAKE_CASE (e.g. APPLIED, PHONE_SCREEN, OA, TECHNICAL_INTERVIEW, ONSITE, OFFER, REJECTED)
- stageDate: date in YYYY-MM-DD format; use today ({today}) if the user doesn't specify
- result: outcome if mentioned (PASSED, FAILED, PENDING); null otherwise""",
        ),
        ("human", "{message}"),
    ]
)

_add_stage_extract_chain = _add_stage_prompt | _llm.with_structured_output(
    StageExtraction
)


def _add_stage_worker(inputs: dict) -> dict:
    extraction: StageExtraction = _add_stage_extract_chain.invoke(
        {
            "message": inputs["message"],
            "today": date.today().isoformat(),
        }
    )

    payload: dict[str, Any] = {
        "stage": extraction.stage,
        "stageDate": extraction.stageDate,
    }
    if extraction.result:
        payload["result"] = extraction.result

    try:
        resp = httpx.post(
            f"{_base_url()}/applications/{inputs['app_id']}/stages",
            json=payload,
            headers=_headers(inputs["token"]),
            timeout=10.0,
        )
        if resp.status_code in (200, 201):
            return {**inputs, "success": True, "changed": payload}
        return {
            **inputs,
            "success": False,
            "error": f"api_{resp.status_code}",
            "changed": {},
        }
    except Exception as exc:
        return {**inputs, "success": False, "error": str(exc), "changed": {}}


# ---------------------------------------------------------------------------
# UpdateStageWorker  (UPDATE_STAGE)
# ---------------------------------------------------------------------------


class StageUpdateExtraction(BaseModel):
    stage_hint: str  # natural-language description of which stage to update
    stageDate: str | None = None
    result: str | None = None


class StageIdSelection(BaseModel):
    appStageId: str  # the id of the matched stage


_update_stage_extract_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """The user wants to update an existing application stage.
Existing stages:
{stages_context}

Extract:
- stage_hint: which stage the user is referring to (enough detail to identify it from the list)
- stageDate: new date in YYYY-MM-DD if mentioned, else null
- result: new result (PASSED, FAILED, PENDING) if mentioned, else null""",
        ),
        ("human", "{message}"),
    ]
)

_update_stage_extract_chain = (
    _update_stage_extract_prompt | _llm.with_structured_output(StageUpdateExtraction)
)

_identify_stage_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """Given these stages:
{stages_context}

The user is referring to: "{stage_hint}"

Return the appStageId of the best matching stage.""",
        ),
        ("human", "Which stage matches?"),
    ]
)

_identify_stage_chain = _identify_stage_prompt | _llm.with_structured_output(
    StageIdSelection
)


def _update_stage_worker(inputs: dict) -> dict:
    # Fetch existing stages
    try:
        resp = httpx.get(
            f"{_base_url()}/applications/{inputs['app_id']}/stages",
            headers=_headers(inputs["token"]),
            timeout=10.0,
        )
        if resp.status_code != 200:
            return {
                **inputs,
                "success": False,
                "error": "fetch_stages_failed",
                "changed": {},
            }
        stages = resp.json()
    except Exception as exc:
        return {**inputs, "success": False, "error": str(exc), "changed": {}}

    if not stages:
        return {
            **inputs,
            "success": False,
            "error": "no_existing_stages",
            "changed": {},
        }

    stages_context = "\n".join(
        f"  id={s['appStageId']}  stage={s['stage']}  date={s.get('stageDate', 'unknown')}  result={s.get('result') or 'none'}"
        for s in stages
    )

    extraction: StageUpdateExtraction = _update_stage_extract_chain.invoke(
        {
            "message": inputs["message"],
            "stages_context": stages_context,
        }
    )

    identification: StageIdSelection = _identify_stage_chain.invoke(
        {
            "stages_context": stages_context,
            "stage_hint": extraction.stage_hint,
        }
    )

    payload: dict[str, Any] = {}
    if extraction.stageDate:
        payload["stageDate"] = extraction.stageDate
    if extraction.result:
        payload["result"] = extraction.result

    if not payload:
        return {
            **inputs,
            "success": False,
            "error": "no_fields_to_update",
            "changed": {},
        }

    try:
        resp = httpx.patch(
            f"{_base_url()}/applications/{inputs['app_id']}/stages/{identification.appStageId}",
            json=payload,
            headers=_headers(inputs["token"]),
            timeout=10.0,
        )
        if resp.status_code == 200:
            return {**inputs, "success": True, "changed": payload}
        return {
            **inputs,
            "success": False,
            "error": f"api_{resp.status_code}",
            "changed": {},
        }
    except Exception as exc:
        return {**inputs, "success": False, "error": str(exc), "changed": {}}


# ---------------------------------------------------------------------------
# SuccessNode / FailureNode
# ---------------------------------------------------------------------------

_success_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a helpful assistant confirming a successful update to a job application tracker. "
            "Be concise and friendly. Summarize exactly what changed.",
        ),
        (
            "human",
            'User said: "{message}"\nIntent: {intent}\nFields updated: {changed}\n\n'
            "Write a brief confirmation of what was recorded or changed.",
        ),
    ]
)

_success_chain = _success_prompt | _llm | StrOutputParser()

_failure_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a helpful assistant explaining why a job application update failed. "
            "Be clear and suggest how the user can fix the issue or rephrase their request.",
        ),
        (
            "human",
            'User said: "{message}"\nIntent: {intent}\nError: {error}\n\n'
            "Explain the problem and suggest next steps.",
        ),
    ]
)

_failure_chain = _failure_prompt | _llm | StrOutputParser()


def _format_response(inputs: dict) -> str:
    if inputs.get("success"):
        return _success_chain.invoke(
            {
                "message": inputs["message"],
                "intent": inputs["intent"],
                "changed": inputs.get("changed", {}),
            }
        )
    return _failure_chain.invoke(
        {
            "message": inputs["message"],
            "intent": inputs["intent"],
            "error": inputs.get("error", "unknown_error"),
        }
    )


# ---------------------------------------------------------------------------
# Full routing chain
# ---------------------------------------------------------------------------

update_app_chain = (
    RunnableLambda(_classify_intent)
    | RunnableBranch(
        (
            lambda x: x["intent"] == Intent.UPDATE_METADATA,
            RunnableLambda(_metadata_worker),
        ),
        (lambda x: x["intent"] == Intent.ADD_STAGE, RunnableLambda(_add_stage_worker)),
        RunnableLambda(_update_stage_worker),  # UPDATE_STAGE default
    )
    | RunnableLambda(_format_response)
)
