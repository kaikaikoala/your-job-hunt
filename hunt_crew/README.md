# HuntCrew Crew

This is being vibe coded with CrewGPT: https://chatgpt.com/g/g-qqTuUWsBY-crewai-assistant

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

    APPLICATIONS {
        int id PK
        string company
        string role
        string job_posting_url
        string status
        string rejection_stage
        date applied_date
        datetime created_at
    }

    INTERVIEW_STAGES {
        int id PK
        int application_id FK
        string stage_name
        date stage_date
        string result
        datetime created_at
    }

    ACTION_ITEMS {
        int id PK
        int application_id FK
        string description
        boolean completed
        datetime created_at
        datetime completed_at
    }

    APPLICATIONS ||--o{ INTERVIEW_STAGES : has
    APPLICATIONS ||--o{ ACTION_ITEMS : has
