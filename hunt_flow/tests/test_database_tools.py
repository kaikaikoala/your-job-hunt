import os
import tempfile
import sqlite3
import pytest

# ---------- MODULE-LEVEL CONSTANTS ----------
TEST_STAGE = "Technical Interview"
TEST_COMPANY = "Google"
TEST_ROLE = "SWE"
TEST_DATE = "2026-02-23"
TEST_CONTACT_NAME = "Jane Doe"

# ---------- FIXTURES ----------

@pytest.fixture
def temp_db():
    """Creates a temporary database file for the duration of the test."""
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        # Set environment variable so the tools know which DB to use
        os.environ["JOB_HUNT_DB_PATH"] = tmp.name
        yield tmp.name

    # Cleanup after test is done
    if os.path.exists(tmp.name):
        os.remove(tmp.name)

# ---------- TESTS ----------

def test_initialize_database(temp_db):
    from hunt_flow.tools.database_tools import initialize_database
    result = initialize_database.run()
    assert "successfully" in result.lower()

    conn = sqlite3.connect(temp_db)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall()]
    conn.close()

    assert "applications" in tables
    assert "application_stage" in tables
    assert "network" in tables
    assert "action_items" in tables

def test_add_application(temp_db):
    from hunt_flow.tools.database_tools import initialize_database, add_application
    initialize_database.run()

    result = add_application.run(company=TEST_COMPANY, role=TEST_ROLE)

    # Assert return message contains the ID
    assert "Application created" in result
    assert "app_id:" in result

    conn = sqlite3.connect(temp_db)
    cursor = conn.cursor()
    cursor.execute("SELECT company, role FROM applications;")
    row = cursor.fetchone()
    conn.close()

    assert row[0] == TEST_COMPANY
    assert row[1] == TEST_ROLE

def test_update_application_success(temp_db):
    from hunt_flow.tools.database_tools import initialize_database, add_application, update_application

    initialize_database.run()
    # Create the initial record
    setup_result = add_application.run(company=TEST_COMPANY, role=TEST_ROLE)

    # Extract ID from the return string "Application created... app_id: 1"
    app_id = int(setup_result.split("app_id: ")[1])

    updates = {
        "salary_range": "150k - 200k",
        "role": "Senior Robotics Engineer"
    }

    # Act
    result = update_application.run(app_id=app_id, updates=updates)

    # Assert
    assert "Successfully updated" in result
    assert str(app_id) in result

    # Verify data changed in DB
    conn = sqlite3.connect(temp_db)
    cursor = conn.cursor()
    cursor.execute("SELECT salary_range, role FROM applications WHERE app_id = ?", (app_id,))
    row = cursor.fetchone()
    conn.close()

    assert row[0] == "150k - 200k"
    assert row[1] == "Senior Robotics Engineer"

def test_add_action_item(temp_db):
    from hunt_flow.tools.database_tools import initialize_database, add_action_item
    initialize_database.run()

    description = "Apply to Google"
    result = add_action_item.run(
        description=description,
        create_date=TEST_DATE,
        status="pending"
    )

    assert "Action item created" in result
    assert "action_item_id:" in result

    conn = sqlite3.connect(temp_db)
    cursor = conn.cursor()
    cursor.execute("SELECT description FROM action_items")
    row = cursor.fetchone()
    conn.close()

    assert row is not None
    assert row[0] == description

def test_add_network_contact(temp_db):
    from hunt_flow.tools.database_tools import initialize_database, add_network_contact
    initialize_database.run()

    contact_type = "Recruiter"
    result = add_network_contact.run(name=TEST_CONTACT_NAME, contact_type=contact_type)

    assert TEST_CONTACT_NAME.lower() in result.lower()
    assert "referrer_id:" in result

    conn = sqlite3.connect(temp_db)
    cursor = conn.cursor()
    cursor.execute("SELECT name, type FROM network WHERE name = ?", (TEST_CONTACT_NAME,))
    row = cursor.fetchone()
    conn.close()

    assert row is not None
    assert row[0] == TEST_CONTACT_NAME
    assert row[1] == contact_type

def test_add_network_contact_defaults(temp_db):
    from hunt_flow.tools.database_tools import initialize_database, add_network_contact
    initialize_database.run()

    add_network_contact.run(name=TEST_CONTACT_NAME)

    conn = sqlite3.connect(temp_db)
    cursor = conn.cursor()
    cursor.execute("SELECT type FROM network WHERE name = ?", (TEST_CONTACT_NAME,))
    row = cursor.fetchone()
    conn.close()

    assert row[0] == "other"


def test_add_application_stage(temp_db):
    from hunt_flow.tools.database_tools import (
        initialize_database, 
        add_application, 
        add_application_stage
    )
    
    initialize_database.run()

    # 1. Arrange: Create a parent application first
    setup_result = add_application.run(company=TEST_COMPANY, role=TEST_ROLE)
    app_id = int(setup_result.split("app_id: ")[1])

    # 2. Act: Add a stage to that application
    result = add_application_stage.run(
        app_id=app_id,
        stage=TEST_STAGE,
        stage_date=TEST_DATE,
        result="Passed"
    )

    # 3. Assert: Check return string
    assert f"added stage '{TEST_STAGE}'" in result
    assert f"application {app_id}" in result

    # 4. Verify in DB
    conn = sqlite3.connect(temp_db)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT stage, result FROM application_stage WHERE app_id = ?", 
        (app_id,)
    )
    row = cursor.fetchone()
    conn.close()

    assert row is not None
    assert row[0] == TEST_STAGE
    assert row[1] == "Passed"

def test_read_only_query_enforcement(temp_db):
    from hunt_flow.tools.database_tools import initialize_database, run_read_only_query
    initialize_database.run()

    # Attempting a destructive query
    result = run_read_only_query.run(query="DELETE FROM applications;")

    assert "Only SELECT queries are allowed" in result
