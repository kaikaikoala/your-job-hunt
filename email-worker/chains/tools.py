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
) -> str | None:
    """
    Insert a new application row. Does not add any stage; caller is responsible
    for adding the initial stage via add_application_stage.
    Skipped if the user already has an open application for the same company+role,
    or if the same job_posting_url is already tracked.
    Returns the app_id string or None on conflict/error.
    """
    app_id = str(uuid.uuid4())

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

    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(check_company_role_sql, (user_id, company, role))
                if cur.fetchone():
                    logger.info(
                        "add_application: skipped duplicate company=%s role=%s",
                        company,
                        role,
                    )
                    return None

                cur.execute(
                    insert_app_sql,
                    (app_id, user_id, company, role, job_posting_url, salary_range),
                )
                row = cur.fetchone()
                if row is None:
                    logger.info(
                        "add_application: skipped duplicate job_posting_url=%s",
                        job_posting_url,
                    )
                    return None
                returned_app_id = str(row[0])
            conn.commit()
        logger.info(
            "add_application: created app_id=%s company=%s", returned_app_id, company
        )
        return returned_app_id
    except Exception as exc:
        logger.error("add_application failed: %s", exc)
        return None


def add_application_stage(
    user_id: str,
    company: str,
    role: str,
    stage: str,
    result: str | None = None,
    stage_date: str | None = None,
) -> str:
    """
    Insert a new stage row for an existing application.
    Looks up the application by user_id + company + role (case-insensitive).
    Returns a descriptive success or error string.
    """
    lookup_sql = """
        SELECT app_id FROM applications
        WHERE user_id = %s AND LOWER(company) = LOWER(%s) AND LOWER(role) = LOWER(%s)
    """
    insert_sql = """
        INSERT INTO application_stage (app_stage_id, app_id, stage, stage_date, result, created_at)
        VALUES (%s, %s, %s, %s, %s, NOW())
    """
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(lookup_sql, (user_id, company, role))
                row = cur.fetchone()
                if row is None:
                    logger.info(
                        "add_application_stage: no app found company=%s role=%s",
                        company,
                        role,
                    )
                    return f"No application found for {company} / {role}"
                app_id = str(row[0])
                stage_id = str(uuid.uuid4())
                cur.execute(insert_sql, (stage_id, app_id, stage, stage_date, result))
            conn.commit()
        logger.info("add_application_stage: added stage=%s app_id=%s", stage, app_id)
        return f"Added stage '{stage}' for {company} / {role}"
    except Exception as exc:
        logger.error("add_application_stage failed: %s", exc)
        return f"Error adding stage: {exc}"


def get_application_summary(user_id: str, company: str, role: str) -> dict:
    """
    Read current application state for a given user/company/role.
    Returns {found, app_id, stages: [{stage, result, stage_date}]}.
    Safe default: returns found=False on any error.
    """
    company_role_sql = """
        SELECT app_id FROM applications
        WHERE user_id = %s AND LOWER(company) = LOWER(%s) AND LOWER(role) = LOWER(%s)
    """
    company_sql = """
        SELECT app_id FROM applications
        WHERE user_id = %s AND LOWER(company) = LOWER(%s)
        LIMIT 1
    """
    stages_sql = """
        SELECT stage, result, stage_date FROM application_stage
        WHERE app_id = %s
        ORDER BY created_at ASC
    """
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                # Find the application
                cur.execute(company_role_sql, (user_id, company, role))
                row = cur.fetchone()
                if row is None:
                    cur.execute(company_sql, (user_id, company))
                    row = cur.fetchone()
                    if row is None:
                        return {"found": False, "app_id": None, "stages": []}
                app_id = str(row[0])
                cur.execute(stages_sql, (app_id,))
                stages = [
                    {
                        "stage": r[0],
                        "result": r[1],
                        "stage_date": str(r[2]) if r[2] else None,
                    }
                    for r in cur.fetchall()
                ]
        return {"found": True, "app_id": app_id, "stages": stages}
    except Exception as exc:
        logger.error("get_application_summary failed: %s", exc)
        return {"found": False, "app_id": None, "stages": []}


def update_application(
    user_id: str,
    company: str,
    role: str | None = None,
    job_posting_url: str | None = None,
    salary_range: str | None = None,
) -> str:
    """
    Update metadata on an existing application. Looks up by user_id + company only,
    since the role itself may be what is being corrected.
    Only fields passed as non-None are updated (others are left unchanged).
    Returns a descriptive success or error string.
    """
    lookup_sql = """
        SELECT app_id FROM applications
        WHERE user_id = %s AND LOWER(company) = LOWER(%s)
        LIMIT 1
    """
    update_sql = """
        UPDATE applications
        SET role = COALESCE(%s, role),
            job_posting_url = COALESCE(%s, job_posting_url),
            salary_range = COALESCE(%s, salary_range)
        WHERE app_id = %s
    """
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(lookup_sql, (user_id, company))
                row = cur.fetchone()
                if row is None:
                    logger.info("update_application: no app found company=%s", company)
                    return f"No application found for {company}"
                app_id = str(row[0])
                cur.execute(update_sql, (role, job_posting_url, salary_range, app_id))
            conn.commit()
        logger.info("update_application: updated app_id=%s company=%s", app_id, company)
        return f"Updated application for {company}"
    except Exception as exc:
        logger.error("update_application failed: %s", exc)
        return f"Error updating application: {exc}"


def get_application(user_id: str, company: str, role: str) -> str | None:
    """
    Exact lookup by user_id + company + role (case-insensitive).
    Returns app_id string or None. Used by app_id_finder_agent.
    """
    sql = """
        SELECT app_id FROM applications
        WHERE user_id = %s AND LOWER(company) = LOWER(%s) AND LOWER(role) = LOWER(%s)
    """
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (user_id, company, role))
                row = cur.fetchone()
        return str(row[0]) if row else None
    except Exception as exc:
        logger.error("get_application failed: %s", exc)
        return None


def get_application_stages(user_id: str, company: str) -> list[dict]:
    """
    Return all applications for a company with their stages.
    [{app_id, role, stages: [{stage, result, stage_date}]}]
    Stages are ordered oldest-first within each app.
    Used by app_id_finder_agent to disambiguate multiple applications.
    """
    apps_sql = """
        SELECT app_id, role FROM applications
        WHERE user_id = %s AND LOWER(company) = LOWER(%s)
    """
    stages_sql = """
        SELECT stage, result, stage_date FROM application_stage
        WHERE app_id = %s
        ORDER BY created_at ASC
    """
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(apps_sql, (user_id, company))
                apps = cur.fetchall()
                result = []
                for app_row in apps:
                    app_id, role = str(app_row[0]), app_row[1]
                    cur.execute(stages_sql, (app_id,))
                    stages = [
                        {
                            "stage": r[0],
                            "result": r[1],
                            "stage_date": str(r[2]) if r[2] else None,
                        }
                        for r in cur.fetchall()
                    ]
                    result.append({"app_id": app_id, "role": role, "stages": stages})
        return result
    except Exception as exc:
        logger.error("get_application_stages failed: %s", exc)
        return []


def get_application_summary_by_id(app_id: str) -> dict:
    """
    Read current application state by app_id directly.
    Returns {found, app_id, stages: [{stage, result, stage_date}]}.
    """
    stages_sql = """
        SELECT stage, result, stage_date FROM application_stage
        WHERE app_id = %s
        ORDER BY created_at ASC
    """
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(stages_sql, (app_id,))
                stages = [
                    {
                        "stage": r[0],
                        "result": r[1],
                        "stage_date": str(r[2]) if r[2] else None,
                    }
                    for r in cur.fetchall()
                ]
        return {"found": True, "app_id": app_id, "stages": stages}
    except Exception as exc:
        logger.error("get_application_summary_by_id failed: %s", exc)
        return {"found": False, "app_id": app_id, "stages": []}


def add_application_stage_by_id(
    app_id: str,
    stage: str,
    result: str | None = None,
    stage_date: str | None = None,
) -> str:
    """
    Insert a new stage row using app_id directly (no company/role lookup).
    Used by application_stage_agent which already has app_id bound.
    Returns a descriptive success or error string.
    """
    insert_sql = """
        INSERT INTO application_stage (app_stage_id, app_id, stage, stage_date, result, created_at)
        VALUES (%s, %s, %s, %s, %s, NOW())
    """
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(insert_sql, (str(uuid.uuid4()), app_id, stage, stage_date, result))
            conn.commit()
        logger.info("add_application_stage_by_id: added stage=%s app_id=%s", stage, app_id)
        return f"Added stage '{stage}'"
    except Exception as exc:
        logger.error("add_application_stage_by_id failed: %s", exc)
        return f"Error adding stage: {exc}"


def update_application_stage_by_id(
    app_id: str,
    stage: str,
    result: str | None = None,
    stage_date: str | None = None,
) -> str:
    """
    Update result and/or stage_date on the most recent matching stage, using app_id directly.
    Used by application_stage_agent which already has app_id bound.
    Returns a descriptive success or error string.
    """
    find_sql = """
        SELECT app_stage_id FROM application_stage
        WHERE app_id = %s AND LOWER(stage) = LOWER(%s)
        ORDER BY created_at DESC
        LIMIT 1
    """
    update_sql = """
        UPDATE application_stage
        SET result = COALESCE(%s, result),
            stage_date = COALESCE(%s, stage_date)
        WHERE app_stage_id = %s
    """
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(find_sql, (app_id, stage))
                row = cur.fetchone()
                if row is None:
                    return f"No stage '{stage}' found"
                cur.execute(update_sql, (result, stage_date, str(row[0])))
            conn.commit()
        logger.info(
            "update_application_stage_by_id: updated stage=%s app_id=%s", stage, app_id
        )
        return f"Updated stage '{stage}'"
    except Exception as exc:
        logger.error("update_application_stage_by_id failed: %s", exc)
        return f"Error updating stage: {exc}"


def get_action_items(user_id: str, app_id: str) -> list[dict]:
    """
    Return open and closed action items for an application.
    [{action_item_id, description, status, due_date}]
    """
    sql = """
        SELECT action_item_id, description, status, due_date
        FROM action_items
        WHERE user_id = %s AND app_id = %s
        ORDER BY create_date ASC
    """
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (user_id, app_id))
                return [
                    {
                        "action_item_id": str(r[0]),
                        "description": r[1],
                        "status": r[2],
                        "due_date": str(r[3]) if r[3] else None,
                    }
                    for r in cur.fetchall()
                ]
    except Exception as exc:
        logger.error("get_action_items failed: %s", exc)
        return []


def add_action_item(
    user_id: str,
    app_id: str,
    description: str,
    due_date: str | None = None,
) -> str:
    """
    Insert a new action item for an application.
    Returns a descriptive success or error string.
    """
    sql = """
        INSERT INTO action_items (action_item_id, user_id, app_id, description, due_date)
        VALUES (%s, %s, %s, %s, %s)
    """
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (str(uuid.uuid4()), user_id, app_id, description, due_date))
            conn.commit()
        logger.info("add_action_item: added description=%r app_id=%s", description, app_id)
        return f"Added action item: {description}"
    except Exception as exc:
        logger.error("add_action_item failed: %s", exc)
        return f"Error adding action item: {exc}"


def update_action_item(
    action_item_id: str,
    description: str | None = None,
    status: str | None = None,
    due_date: str | None = None,
) -> str:
    """
    Update description, status, and/or due_date on an existing action item.
    Only fields passed as non-None are updated.
    Returns a descriptive success or error string.
    """
    sql = """
        UPDATE action_items
        SET description = COALESCE(%s, description),
            status = COALESCE(%s, status),
            due_date = COALESCE(%s, due_date)
        WHERE action_item_id = %s
    """
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (description, status, due_date, action_item_id))
                if cur.rowcount == 0:
                    return f"No action item found with id {action_item_id}"
            conn.commit()
        logger.info("update_action_item: updated action_item_id=%s", action_item_id)
        return f"Updated action item {action_item_id}"
    except Exception as exc:
        logger.error("update_action_item failed: %s", exc)
        return f"Error updating action item: {exc}"


def update_application_stage(
    user_id: str,
    company: str,
    role: str,
    stage: str,
    result: str | None = None,
    stage_date: str | None = None,
) -> str:
    """
    Update result and/or stage_date on the most recent matching stage for an application.
    Looks up by user_id + company + role + stage (all case-insensitive).
    Returns a descriptive success or error string.
    """
    lookup_sql = """
        SELECT app_id FROM applications
        WHERE user_id = %s AND LOWER(company) = LOWER(%s) AND LOWER(role) = LOWER(%s)
    """
    find_stage_sql = """
        SELECT app_stage_id FROM application_stage
        WHERE app_id = %s AND LOWER(stage) = LOWER(%s)
        ORDER BY created_at DESC
        LIMIT 1
    """
    update_sql = """
        UPDATE application_stage
        SET result = COALESCE(%s, result),
            stage_date = COALESCE(%s, stage_date)
        WHERE app_stage_id = %s
    """
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(lookup_sql, (user_id, company, role))
                app_row = cur.fetchone()
                if app_row is None:
                    logger.info(
                        "update_application_stage: no app found company=%s role=%s",
                        company,
                        role,
                    )
                    return f"No application found for {company} / {role}"
                app_id = str(app_row[0])

                cur.execute(find_stage_sql, (app_id, stage))
                stage_row = cur.fetchone()
                if stage_row is None:
                    logger.info(
                        "update_application_stage: no stage=%s found for app_id=%s",
                        stage,
                        app_id,
                    )
                    return f"No stage '{stage}' found for {company} / {role}"
                stage_id = str(stage_row[0])

                cur.execute(update_sql, (result, stage_date, stage_id))
            conn.commit()
        logger.info(
            "update_application_stage: updated stage=%s app_id=%s", stage, app_id
        )
        return f"Updated stage '{stage}' for {company} / {role}"
    except Exception as exc:
        logger.error("update_application_stage failed: %s", exc)
        return f"Error updating stage: {exc}"
