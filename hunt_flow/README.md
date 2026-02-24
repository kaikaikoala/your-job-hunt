# Agentic Job Hunt Tracker

## Run
uv run crewai run

## Description
A conversational CLI application built with **CrewAI** to track and analyze your job search:
- Record job applications
- Track interview stages
- Manage action items
- Query and analyze your job hunt progress

User input is saved in an sqlite db.

## Agent architecture
* Manager agent
  * name: job_hunt_manager
  * Classfies requests as record/update or analysis/query
  * Delegates a specialist agent
* Recorder agent
  * name: job_application_recorder
  * Handles all DB writes: applications, interview stages, action items
* Analyst agent
  * name: job_hunt_analyst
  * Runs agentically created sql queries (SELECT only)

## Data storage ERD

```mermaid
erDiagram
    application_stage {
        string app_stage_id PK
        string app_id FK
        string stage
        string stage_date
        string result
    }
    application_stage }|--|| applications : ""

    applications {
        string app_id PK
        string company
        string role
        string job_posting_url
        string referrer_id FK
        string salary_range
        string required_skills
        string exp_required
    }
    applications |o--o{ action_items : ""
    applications }o--o| network : ""

    action_items }o--o| network : ""

    action_items {
        string action_item_id PK
        string app_id FK
        string referrer_id FK
        string description
        string status
        string due_date
        string create_date
    }

    network {
        string referrer_id PK
        string name
        string type
    }


