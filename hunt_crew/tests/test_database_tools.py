import os
import tempfile
import sqlite3
import pytest

# Set temp DB before importing tools
@pytest.fixture
def temp_db():
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        os.environ["JOB_HUNT_DB_PATH"] = tmp.name
        yield tmp.name
    os.remove(tmp.name)


def test_initialize_database(temp_db):
    from hunt_crew.tools.database_tools import initialize_database
    result = initialize_database.run()
    assert "successfully" in result.lower()

    conn = sqlite3.connect(temp_db)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall()]
    conn.close()

    assert "applications" in tables
    assert "interview_stages" in tables
    assert "action_items" in tables


def test_create_application(temp_db):
    from hunt_crew.tools.database_tools import (
        initialize_database,
        create_application,
        run_read_only_query
    )

    initialize_database.run()
    create_application.run("Google", "PM Wallet", "2026-02-01")

    result = run_read_only_query.run("SELECT company, role FROM applications;")
    assert "Google" in result
    assert "PM Wallet" in result


def test_disambiguation(temp_db):
    from hunt_crew.tools.database_tools import (
        initialize_database,
        create_application,
        add_interview_stage
    )

    initialize_database.run()

    result = add_interview_stage.run(
        "Google",
        "PM",
        "Recruiter Screen",
        "2026-06-10",
        "pass"
    )

    assert "No matching application found." in result

def test_active_application_block(temp_db):
    from hunt_crew.tools.database_tools import (
        initialize_database,
        create_application
    )

    initialize_database.run()
    create_application.run("Google", "PM Wallet", "2026-02-01")
    result = create_application.run("Google", "PM Wallet", "2026-02-15")

    assert "already have an active application" in result


def test_add_interview_stage(temp_db):
    from hunt_crew.tools.database_tools import (
        initialize_database,
        create_application,
        add_interview_stage,
        run_read_only_query
    )

    initialize_database.run()
    create_application.run("Stripe", "Product Analyst", "2026-02-01")

    add_interview_stage.run(
        "Stripe",
        "Product Analyst",
        "Technical",
        "2026-02-10",
        "pass"
    )

    result = run_read_only_query.run("SELECT stage_name FROM interview_stages;")
    assert "Technical" in result


def test_action_item_flow(temp_db):
    from hunt_crew.tools.database_tools import (
        initialize_database,
        create_application,
        add_action_item,
        mark_action_completed,
        run_read_only_query
    )

    initialize_database.run()
    create_application.run("Meta", "Data Scientist", "2026-02-01")

    add_action_item.run("Meta", "Data Scientist", "Send follow-up email")

    result = run_read_only_query.run(
        "SELECT description FROM action_items WHERE completed = 0;"
    )
    assert "Send follow-up email" in result

    mark_action_completed.run("Meta", "Data Scientist", "Send follow-up email")

    result = run_read_only_query.run(
        "SELECT description FROM action_items WHERE completed = 1;"
    )
    assert "Send follow-up email" in result


def test_read_only_query_enforcement(temp_db):
    from hunt_crew.tools.database_tools import (
        initialize_database,
        run_read_only_query
    )

    initialize_database.run()
    result = run_read_only_query.run("DELETE FROM applications;")
    assert "Only SELECT queries are allowed" in result
