import os
import tempfile
import sqlite3
import pytest


@pytest.fixture
def temp_db():
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        os.environ["JOB_HUNT_DB_PATH"] = tmp.name
        yield tmp.name
    os.remove(tmp.name)


def test_generate_sankey(temp_db):
    from hunt_crew.tools.database_tools import (
        initialize_database,
        create_application,
        add_interview_stage,
    )
    from hunt_crew.tools.visualization_tools import generate_sankey

    # Initialize DB
    initialize_database.run()

    # Create google application
    create_application.run("Google", "PM Wallet", "2026-02-01")
    add_interview_stage.run(
        "Google",
        "PM Wallet",
        "Recruiter Screen",
        "2026-02-05",
        "pass",
    )
    add_interview_stage.run(
        "Google",
        "PM Wallet",
        "Phone interview",
        "2026-02-10",
        "sucess",
    )
    add_interview_stage.run(
        "Google",
        "PM Wallet",
        "Onsite",
        "2026-02-20",
        "sucess",
    )
    # Create google application
    create_application.run("Google", "PM Wallet", "2026-02-01")
    add_interview_stage.run(
        "Google",
        "PM Wallet",
        "Recruiter Screen",
        "2026-02-05",
        "pass",
    )
    add_interview_stage.run(
        "Google",
        "PM Wallet",
        "Phone interview",
        "2026-02-10",
        "sucess",
    )
    add_interview_stage.run(
        "Google",
        "PM Wallet",
        "Onsite",
        "2026-02-20",
        "sucess",
    )


    # Generate Sankey
    result = generate_sankey.run()

    # Validate success message
    assert "Sankey diagram generated" in result

    # Extract file path
    output_path = result.split(": ")[-1].strip()

    # Verify file exists
    assert os.path.exists(output_path)

    # Cleanup generated file
    # os.remove(output_path)

