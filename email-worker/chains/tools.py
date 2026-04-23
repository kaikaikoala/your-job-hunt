"""
DB write tools invoked by the orchestrator agent.
All functions write directly to PostgreSQL via psycopg2.
"""
from __future__ import annotations

import logging
import uuid

from db import get_conn

logger = logging.getLogger(__name__)


def add_application(
    user_id: str,
    company: str,
    role: str,
    job_posting_url: str | None = None,
    salary_range: str | None = None,
    stage_date: str | None = None,
) -> str | None:
    """
    Insert a new application row and add an initial 'Applied' stage.
    Skipped if the user already has an open application for the same company+role,
    or if the same job_posting_url is already tracked.
    Returns the app_id string or None on conflict/error.
    """
    app_id = str(uuid.uuid4())
    stage_id = str(uuid.uuid4())

    # TODO: allow insert when the existing application's latest stage is Rejected.
    check_company_role_sql = """
        SELECT app_id FROM applications WHERE user_id = %s AND company = %s AND role = %s
    """
    insert_app_sql = """
        INSERT INTO applications (app_id, user_id, company, role, job_posting_url, salary_range)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (user_id, job_posting_url)
        DO NOTHING
        RETURNING app_id
    """
    insert_stage_sql = """
        INSERT INTO application_stage (app_stage_id, app_id, stage, stage_date, result, created_at)
        VALUES (%s, %s, 'Applied', %s, 'Pending', NOW())
    """

    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(check_company_role_sql, (user_id, company, role))
                if cur.fetchone():
                    logger.info(
                        "add_application: skipped duplicate company=%s role=%s", company, role
                    )
                    return None

                cur.execute(
                    insert_app_sql,
                    (app_id, user_id, company, role, job_posting_url, salary_range),
                )
                row = cur.fetchone()
                if row is None:
                    logger.info(
                        "add_application: skipped duplicate job_posting_url=%s", job_posting_url
                    )
                    return None
                returned_app_id = str(row[0])
                cur.execute(insert_stage_sql, (stage_id, returned_app_id, stage_date))
            conn.commit()
        logger.info("add_application: created app_id=%s company=%s", returned_app_id, company)
        return returned_app_id
    except Exception as exc:
        logger.error("add_application failed: %s", exc)
        return None
