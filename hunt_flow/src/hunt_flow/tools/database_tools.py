import sqlite3
from sqlite3 import IntegrityError
import os
from pathlib import Path
from dotenv import load_dotenv
from crewai.tools import tool

# ---------- DATABASE LOCATION ----------
def get_db_path():
    load_dotenv()
    if os.environ.get("JOB_HUNT_DB_PATH"):
        return os.environ["JOB_HUNT_DB_PATH"]

    # Default to project root
    project_root = Path(__file__).parent.parent.parent.parent
    return str(project_root / "job_hunt.db")

# ---------- DATABASE INITIALIZATION ----------

@tool
def initialize_database() -> str:
    """Initializes the database by executing the schema.sql file."""
    try:
        current_dir = Path(__file__).parent
        schema_path = current_dir / "schema.sql"

        with open(schema_path, "r") as f:
            sql_script = f.read()

        conn = sqlite3.connect(get_db_path())
        cursor = conn.cursor()
        cursor.executescript(sql_script)
        conn.commit()
        conn.close()
        return "Database initialized successfully."
    except Exception as e:
        return f"Database initialization failed: {str(e)}"

# ---------- ADD APPLICATION ----------

@tool
def add_application(
    company: str,
    role: str,
    referrer_id: int = None,
    job_posting_url: str = None,
    salary_range: str = None,
    skills_required: str = None,
    experience_required: str = None
) -> str:
    """Creates a new job application and returns the new app_id."""
    try:
        conn = sqlite3.connect(get_db_path())
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO applications (
                company, role, referrer_id, job_posting_url,
                salary_range, skills_required, experience_required
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (company, role, referrer_id, job_posting_url,
              salary_range, skills_required, experience_required))

        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return f"Application created for {company}. app_id: {new_id}"
    except Exception as e:
        return f"Error adding application: {str(e)}"

# ---------- ADD ACTION ITEM ----------

@tool
def add_action_item(
    description: str,
    create_date: str,
    app_id: int = None,
    referrer_id: int = None,
    status: str = "pending",
    due_date: str = None
) -> str:
    """Adds a task/follow-up and returns the action_item_id."""
    try:
        conn = sqlite3.connect(get_db_path())
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO action_items (
                description, create_date, app_id, referrer_id, status, due_date
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (description, create_date, app_id, referrer_id, status, due_date))

        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return f"Action item created. action_item_id: {new_id}"
    except Exception as e:
        return f"Error adding action item: {str(e)}"

# ---------- ADD NETWORK CONTACT ----------

@tool
def add_network_contact(name: str, contact_type: str = "other") -> str:
    """Adds a networking contact and returns the referrer_id."""
    try:
        conn = sqlite3.connect(get_db_path())
        cursor = conn.cursor()

        cursor.execute("INSERT INTO network (name, type) VALUES (?, ?)", (name, contact_type))

        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return f"Contact '{name}' added. referrer_id: {new_id}"
    except Exception as e:
        return f"Error adding contact: {str(e)}"

# ---------- UPDATE APPLICATION ----------

@tool
def update_application(app_id: int, updates: dict) -> str:
    """Updates fields for an existing app_id (e.g., salary_range, role)."""
    try:
        if not updates: return "No updates provided."
        set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values())
        values.append(app_id)

        conn = sqlite3.connect(get_db_path())
        cursor = conn.cursor()
        cursor.execute(f"UPDATE applications SET {set_clause} WHERE app_id = ?", values)
        conn.commit()
        conn.close()
        return f"Successfully updated application {app_id}."
    except Exception as e:
        return f"Error updating application: {str(e)}"

@tool
def add_application_stage(
    app_id: int, 
    stage: str, 
    stage_date: str, 
    result: str = None
) -> str:
    """
    Records a new stage/event for a specific application (e.g., 'Interview', 'Offer').
    :param app_id: The ID of the parent application.
    :param stage: Name of the stage (e.g., 'Initial Screen', 'Technical').
    :param stage_date: Date in YYYY-MM-DD format.
    :param result: Optional outcome of the stage.
    """
    try:
        conn = sqlite3.connect(get_db_path())
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO application_stage (app_id, stage, stage_date, result)
            VALUES (?, ?, ?, ?)
        """, (app_id, stage, stage_date, result))
        conn.commit()
        conn.close()
        
        return (f"Successfully added stage '{stage}' for application {app_id}. "
                "Reminder: Ensure previous stages are updated if they are now completed.")

    except IntegrityError:
        # This catches the Foreign Key failure specifically
        return (f"Error: The application ID '{app_id}' does not exist in the database. "
                "Please use the 'run_read_only_query' tool to find the correct app_id "
                "for this company before trying again.")
    
    except Exception as e:
        # This catches everything else (typos, connection issues, etc.)
        return f"An unexpected error occurred: {str(e)}"

@tool
def update_application_stage_result(
    app_stage_id: int, 
    result: str = None
) -> str:
    """
    Updates the result of a specific application stage.
    :param app_stage_id: The ID of the application stage to update.
    :param result: The outcome of the stage (e.g., 'Passed', 'Rejected').
    """
    try:
        conn = sqlite3.connect(get_db_path()) # Fixed variable name
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE application_stage SET result = ? WHERE app_stage_id = ?
        """, (result, app_stage_id))

        conn.commit() # Critical: otherwise changes aren't saved
        
        # Check if anything was actually updated
        if cursor.rowcount == 0:
            conn.close()
            return f"Error: No stage found with ID {app_stage_id}."

        conn.close()
        return f"Successfully updated result to '{result}' for stage ID {app_stage_id}."

    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"

@tool
def run_read_only_query(query: str) -> str:
    """Executes SELECT queries for analysis."""
    if not query.strip().lower().startswith("select"):
        return "Only SELECT queries are allowed."
    try:
        conn = sqlite3.connect(get_db_path())
        cursor = conn.cursor()
        cursor.execute(query)
        results = cursor.fetchall()
        conn.close()
        return str(results) if results else "No results."
    except Exception as e:
        return f"Query failed: {str(e)}"
