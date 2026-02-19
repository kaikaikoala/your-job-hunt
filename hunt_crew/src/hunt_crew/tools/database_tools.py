import sqlite3
import os
from datetime import datetime
from crewai.tools import tool

# ---------- DATABASE LOCATION ----------
DB_NAME = "job_hunt.db"

def get_db_path():
    default_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../../job_hunt.db")
    )
    return os.environ.get("JOB_HUNT_DB_PATH", default_path)

# ---------- DATABASE INITIALIZATION ----------

@tool
def initialize_database() -> str:
    """Initializes the SQLite database and creates required tables."""
    try:
        conn = sqlite3.connect(get_db_path())
        cursor = conn.cursor()

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company TEXT NOT NULL,
            role TEXT NOT NULL,
            date_applied TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            rejection_stage TEXT,
            job_posting_url TEXT,
            notes TEXT
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS interview_stages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            application_id INTEGER NOT NULL,
            stage_name TEXT NOT NULL,
            date_entered TEXT NOT NULL,
            result TEXT NOT NULL,
            FOREIGN KEY(application_id) REFERENCES applications(id)
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS action_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            application_id INTEGER NOT NULL,
            description TEXT NOT NULL,
            due_date TEXT,
            completed INTEGER DEFAULT 0,
            FOREIGN KEY(application_id) REFERENCES applications(id)
        )
        """)

        conn.commit()
        conn.close()

        return "Database initialized successfully."

    except Exception as e:
        return f"Database initialization failed: {str(e)}"


# ---------- INTERNAL HELPER ----------

def resolve_application(company: str, role: str):
    """Resolves an application by company + role with disambiguation."""
    conn = sqlite3.connect(get_db_path())
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, company, role, date_applied
        FROM applications
        WHERE LOWER(company) = LOWER(?)
        AND LOWER(role) = LOWER(?)
        ORDER BY date_applied DESC
    """, (company, role))

    results = cursor.fetchall()
    conn.close()

    if len(results) == 0:
        return None, "No matching application found."

    if len(results) > 1:
        message = "Multiple applications found:\n"
        for r in results:
            message += f"- {r[1]} | {r[2]} | Applied: {r[3]}\n"
        message += "Please specify which one."
        return None, message

    return results[0][0], None


# ---------- CREATE APPLICATION ----------

@tool
def create_application(
    company: str,
    role: str,
    date_applied: str,
    job_posting_url: str = None,
    notes: str = None
) -> str:
    """Creates a new job application entry with uniqueness check on active applications."""
    try:
        conn = sqlite3.connect(get_db_path())
        cursor = conn.cursor()

        # Check for existing active applications
        cursor.execute("""
        SELECT id, status FROM applications
        WHERE LOWER(company) = LOWER(?)
        AND LOWER(role) = LOWER(?)
        AND status NOT IN ('rejected', 'denied', 'offer', 'ghosted')
        """, (company, role))

        existing = cursor.fetchall()
        if existing:
            return (f"You already have an active application for {company} - {role}. "
                    "Please provide a more descriptive role name (e.g., add the team name) "
                    "to differentiate.")

        # Insert new application
        cursor.execute("""
        INSERT INTO applications (company, role, date_applied, job_posting_url, notes)
        VALUES (?, ?, ?, ?, ?)
        """, (company, role, date_applied, job_posting_url, notes))

        conn.commit()
        conn.close()

        return f"Application created for {company} - {role}."

    except Exception as e:
        return f"Error creating application: {str(e)}"

# ---------- ADD INTERVIEW STAGE ----------

@tool
def add_interview_stage(
    company: str,
    role: str,
    stage_name: str,
    date_entered: str,
    result: str
) -> str:
    """Adds an interview stage to an existing application."""
    app_id, error = resolve_application(company, role)
    if error:
        return error

    try:
        conn = sqlite3.connect(get_db_path())
        cursor = conn.cursor()

        cursor.execute("""
        INSERT INTO interview_stages (application_id, stage_name, date_entered, result)
        VALUES (?, ?, ?, ?)
        """, (app_id, stage_name, date_entered, result))

        conn.commit()
        conn.close()

        return f"Stage '{stage_name}' added for {company} - {role}."

    except Exception as e:
        return f"Error adding stage: {str(e)}"


# ---------- UPDATE APPLICATION STATUS ----------

@tool
def update_application_status(
    company: str,
    role: str,
    status: str,
    rejection_stage: str = None
) -> str:
    """Updates the status of an application."""
    app_id, error = resolve_application(company, role)
    if error:
        return error

    try:
        conn = sqlite3.connect(get_db_path())
        cursor = conn.cursor()

        cursor.execute("""
        UPDATE applications
        SET status = ?, rejection_stage = ?
        WHERE id = ?
        """, (status, rejection_stage, app_id))

        conn.commit()
        conn.close()

        return f"Application status updated for {company} - {role}."

    except Exception as e:
        return f"Error updating status: {str(e)}"


# ---------- ADD ACTION ITEM ----------

@tool
def add_action_item(
    company: str,
    role: str,
    description: str,
    due_date: str = None
) -> str:
    """Adds an action item to an application."""
    app_id, error = resolve_application(company, role)
    if error:
        return error

    try:
        conn = sqlite3.connect(get_db_path())
        cursor = conn.cursor()

        cursor.execute("""
        INSERT INTO action_items (application_id, description, due_date)
        VALUES (?, ?, ?)
        """, (app_id, description, due_date))

        conn.commit()
        conn.close()

        return f"Action item added for {company} - {role}."

    except Exception as e:
        return f"Error adding action item: {str(e)}"


# ---------- MARK ACTION COMPLETED ----------

@tool
def mark_action_completed(
    company: str,
    role: str,
    description: str
) -> str:
    """Marks an action item as completed."""
    app_id, error = resolve_application(company, role)
    if error:
        return error

    try:
        conn = sqlite3.connect(get_db_path())
        cursor = conn.cursor()

        cursor.execute("""
        UPDATE action_items
        SET completed = 1
        WHERE application_id = ?
        AND LOWER(description) = LOWER(?)
        """, (app_id, description))

        conn.commit()
        conn.close()

        return f"Action item marked complete for {company} - {role}."

    except Exception as e:
        return f"Error updating action item: {str(e)}"


# ---------- LIST PENDING ACTION ITEMS ----------

@tool
def list_pending_action_items() -> str:
    """Lists all pending action items."""
    try:
        conn = sqlite3.connect(get_db_path())
        cursor = conn.cursor()

        cursor.execute("""
        SELECT a.company, a.role, ai.description, ai.due_date
        FROM action_items ai
        JOIN applications a ON ai.application_id = a.id
        WHERE ai.completed = 0
        """)

        results = cursor.fetchall()
        conn.close()

        if not results:
            return "No pending action items."

        message = "Pending action items:\n"
        for r in results:
            message += f"- {r[0]} | {r[1]} | {r[2]} | Due: {r[3]}\n"

        return message

    except Exception as e:
        return f"Error retrieving pending items: {str(e)}"


# ---------- READ-ONLY QUERY TOOL ----------

@tool
def run_read_only_query(query: str) -> str:
    """Executes a SELECT-only SQL query for analytics purposes."""
    if not query.strip().lower().startswith("select"):
        return "Only SELECT queries are allowed."

    try:
        conn = sqlite3.connect(get_db_path())
        cursor = conn.cursor()

        cursor.execute(query)
        results = cursor.fetchall()

        conn.close()

        if not results:
            return "Query executed successfully. No results."

        return str(results)

    except Exception as e:
        return f"Query failed: {str(e)}"
