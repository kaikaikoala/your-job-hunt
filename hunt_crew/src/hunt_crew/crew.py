import os
from dotenv import load_dotenv
from crewai import Agent, Crew, Process, Task, LLM
from crewai.project import CrewBase, agent, task, crew

from hunt_crew.tools.database_tools import (
    initialize_database,
    create_application,
    add_interview_stage,
    update_application_status,
    add_action_item,
    mark_action_completed,
    list_pending_action_items,
    run_read_only_query,
)

# Load environment variables
load_dotenv()


@CrewBase
class HuntCrew:
    """Python-only HuntCrew job hunt tracker using implicit manager"""

    # -------------------------
    # Agents
    # -------------------------
    @agent
    def job_hunt_recorder(self) -> Agent:
        return Agent(
            role="Database Associate",      # human-readable
            goal="Accurately record and update structured job application data.",
            backstory="You are meticulous about data integrity, modifying applications, stages, and action items precisely.",
            tools=[
                create_application,
                add_interview_stage,
                update_application_status,
                add_action_item,
                mark_action_completed,
            ],
            allow_delegation=False,
            verbose=True,
        )

    @agent
    def job_hunt_analyst(self) -> Agent:
        return Agent(
            role="Data Analyst",
            goal="Answer analytical questions about the job hunt using stored data.",
            backstory="You specialize in analyzing job hunt data and producing clear insights. You never modify records.",
            tools=[
                list_pending_action_items,
                run_read_only_query,
            ],
            allow_delegation=False,
            verbose=True,
        )

    # -------------------------
    # Tasks
    # -------------------------
    @task
    def record_job_application(self) -> Task:
        return Task(
            role="job_hunt_recorder",
            description="Record or update a job application in the database.",
            agent=self.job_hunt_recorder(),
            expected_output="A structured confirmation of the job application recorded in the database."
        )

    @task
    def query_applications(self) -> Task:
        return Task(
            role="job_hunt_analyst",
            description="Query and summarize job applications or action items.",
            agent=self.job_hunt_analyst(),
            expected_output="A structured summary or list of job applications or action items."
        )

    # -------------------------
    # Crew
    # -------------------------
    @crew
    def crew(self) -> Crew:
        # Initialize database
        initialize_database.run()

        # Load LLM from environment
        llm_model = os.environ.get("CREWAI_LLM_MODEL", "gemini-2.0-flash-lite-001")
        llm = LLM(model=llm_model)

        # Instantiate agents
        recorder = self.job_hunt_recorder()
        analyst = self.job_hunt_analyst()

        # Debug: print registered agents
        print("===== Registered agents in Crew =====")
        for a in [recorder, analyst]:
            print(f"- ID: {getattr(a, 'id', 'no-id')}, Role: {a.role}")

        # Use hierarchical process with implicit manager
        return Crew(
            agents=[recorder, analyst],
            tasks=[self.record_job_application(), self.query_applications()],
            process=Process.hierarchical,  # implicit manager used
            llm=llm,
            max_iterations=3,
            verbose=True,
        )
