from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from crewai_tools import ScrapeWebsiteTool
from typing import List
from hunt_flow.tools.database_tools import (
    run_read_only_query,
)
from hunt_flow.tools.scraper_tool import smart_scraper

# If you want to run a snippet of code before or after the crew starts,
# you can use the @before_kickoff and @after_kickoff decorators
# https://docs.crewai.com/concepts/crews#example-crew-class-with-decorators

@CrewBase
class AnalystCrew():
    """AnalystCrew crew"""

    agents: List[BaseAgent]
    tasks: List[Task]

    # Agents
    @agent
    def analyst(self) -> Agent:
        return Agent(
            config=self.agents_config['analyst'], # type: ignore[index]
            verbose=True
        )

    # Tasks
    @task
    def summary_task(self) -> Task:
        return Task(
            config=self.tasks_config['summary_task'],
            tools=[run_read_only_query],
        )

    @crew
    def crew(self) -> Crew:
        """Creates the AnalystCrew crew"""

        return Crew(
            agents=self.agents, # Automatically created by the @agent decorator
            tasks=self.tasks, # Automatically created by the @task decorator
            process=Process.sequential,
            verbose=True,
            # process=Process.hierarchical, # In case you wanna use that instead https://docs.crewai.com/how-to/Hierarchical/
        )
