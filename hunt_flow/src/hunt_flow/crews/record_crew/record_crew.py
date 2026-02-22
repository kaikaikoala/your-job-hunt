from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from crewai_tools import ScrapeWebsiteTool
from typing import List
from hunt_flow.tools.database_tools import (
    initialize_database,
    check_applications,
    update_application_job_link,
    create_application,
    add_interview_stage,
    update_application_status,
    add_action_item,
    mark_action_completed,
    list_pending_action_items,
    run_read_only_query,
)
from hunt_flow.tools.scraper_tool import smart_scraper

# If you want to run a snippet of code before or after the crew starts,
# you can use the @before_kickoff and @after_kickoff decorators
# https://docs.crewai.com/concepts/crews#example-crew-class-with-decorators

@CrewBase
class RecordCrew():
    initialize_database.run()
    """RecordCrew crew"""

    agents: List[BaseAgent]
    tasks: List[Task]

    # Learn more about YAML configuration files here:
    # Agents: https://docs.crewai.com/concepts/agents#yaml-configuration-recommended
    # Tasks: https://docs.crewai.com/concepts/tasks#yaml-configuration-recommended

    # If you would like to add tools to your agents, you can learn more about it here:
    # https://docs.crewai.com/concepts/agents#agent-tools
    @agent
    def researcher(self) -> Agent:
        return Agent(
            config=self.agents_config['researcher'],
            tools=[smart_scraper],
            verbose=True
        )

    @agent
    def recorder(self) -> Agent:
        return Agent(
            config=self.agents_config['recorder'], # type: ignore[index]
             tools=[
                create_application,
                add_interview_stage,
                update_application_job_link,
                update_application_status,
                add_action_item,
                mark_action_completed,
            ],
            verbose=True
        )

    # To learn more about structured task outputs,
    # task dependencies, and task callbacks, check out the documentation:
    # https://docs.crewai.com/concepts/tasks#overview-of-a-task
    @task
    def research_task(self) -> Task:
        return Task(
            config=self.tasks_config['research_task'], # type: ignore[index]
        )
    @task
    def record_task(self) -> Task:
        return Task(
            config=self.tasks_config['record_task'], # type: ignore[index]
        )

    @crew
    def crew(self) -> Crew:
        """Creates the RecordCrew crew"""
        # To learn how to add knowledge sources to your crew, check out the documentation:
        # https://docs.crewai.com/concepts/knowledge#what-is-knowledge

        return Crew(
            agents=self.agents, # Automatically created by the @agent decorator
            tasks=self.tasks, # Automatically created by the @task decorator
            process=Process.sequential,
            verbose=True,
            # process=Process.hierarchical, # In case you wanna use that instead https://docs.crewai.com/how-to/Hierarchical/
        )
