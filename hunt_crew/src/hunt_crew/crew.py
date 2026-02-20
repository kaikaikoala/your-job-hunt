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
    """HuntCrew job hunt tracker crew"""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    # -------------------------
    # Agents
    # -------------------------
    @agent
    def job_hunt_manager(self) -> Agent:
        return Agent(
            config=self.agents_config["job_hunt_manager"],
            allow_delegation=True,
        )

    @agent
    def job_hunt_recorder(self) -> Agent:
        return Agent(
            config=self.agents_config["job_hunt_recorder"],
            role="job_hunt_recorder",
            tools=[
                create_application,
                add_interview_stage,
                update_application_status,
                add_action_item,
                mark_action_completed,
            ],
            allow_delegation=False,
        )

    @agent
    def job_hunt_analyst(self) -> Agent:
        return Agent(
            config=self.agents_config["job_hunt_analyst"],
            role="job_hunt_analyst",
            tools=[
                list_pending_action_items,
                run_read_only_query,
            ],
            allow_delegation=False,
        )

    # -------------------------
    # Tasks
    # -------------------------
    @task
    def handle_user_request(self) -> Task:
        return Task(
            config=self.tasks_config["handle_user_request"],
            agent=self.job_hunt_manager(),
        )

    @task
    def record_job_application(self) -> Task:
        return Task(
            config=self.tasks_config["record_job_application"],
            agent=self.job_hunt_recorder(),
        )

    @task
    def query_applications(self) -> Task:
        return Task(
            config=self.tasks_config["query_applications"],
            agent=self.job_hunt_analyst(),
        )

    # -------------------------
    # Crew
    # -------------------------
    @crew
    def crew(self) -> Crew:
        # Initialize database
        initialize_database.run()

        # Load LLM from environment
        llm_model = os.environ.get("MODEL", "gemini-2.0-flash-lite-001")
        llm = LLM(model=llm_model)

        return Crew(
            agents=[
                self.job_hunt_recorder(),
                self.job_hunt_analyst(),
            ],
            tasks=[
                self.handle_user_request(),
                self.record_job_application(),
                self.query_applications(),
            ],
            process=Process.hierarchical,
            manager_agent=self.job_hunt_manager(),
            llm=llm,
            max_iterations=3,
            verbose=True,
        )
