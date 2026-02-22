#!/usr/bin/env python
from random import randint
from pydantic import BaseModel
from dotenv import load_dotenv
from enum import Enum, auto
from datetime import datetime
import os
from hunt_flow.crews.record_crew.record_crew import RecordCrew

from crewai import LLM
from crewai.flow import Flow, listen, start, router


load_dotenv()

class HuntAction(Enum):
    UNKNOWN = "UNKNOWN"
    RECORD = "RECORD"
    ANALYZE = "ANALYZE"

class HuntState(BaseModel):
    action: HuntAction = HuntAction.UNKNOWN
    user_input: str = ""
    current_date: str = ""


class HuntFlow(Flow[HuntState]):
    routerLlm = LLM(
        model=os.environ.get("ROUTER_MODEL", "gemini-2.0-flash-lite"),
        response_format=HuntState
    )

    @start()
    def get_user_input(self):
        return self.state.user_input

    @router(get_user_input)
    def route_user_intent(self):
        messages = [
            {
                "role": "system",
                "content": "Route to: RECORD (new info), ANALYZE (questions), or UNKNOWN. Reply 1 word."
            },
            {
                "role": "user",
                "content": f"IBM app -> RECORD; How many apps? -> ANALYZE; '{self.state.user_input}' ->"
            }
        ]
        try:
            user_intent: HuntState = self.routerLlm.call(messages=messages)
        except KeyError:
            self.state.action = HuntAction.UNKNOWN
        self.state.action = user_intent.action
        return self.state.action.value

    @listen(HuntAction.UNKNOWN.value)
    def new_user_input(self):
        print("Sorry I do not know what action to take. Please preface your response with 'record' or 'analyze'\n")
        self.state.user_input = input("You: ")
        return self.get_user_input()

    @listen(HuntAction.RECORD.value)
    def record(self):
        record_crew = RecordCrew().crew()
        result = record_crew.kickoff(
            inputs={
                'user_input': self.state.user_input,
                'current_date': self.state.current_date,
            })
        print(result)
        return

    @listen(HuntAction.ANALYZE.value)
    def analyze(self):
        print("ANALYZE")
        return


def kickoff():
    current_date = datetime.now().strftime("%Y-%m-%d")
    hunt_flow = HuntFlow()
    print("Welcome to your Job Hunt Assistant! (Type 'exit' to quit)")
    while True:
        user_input = input("\nYou: ")
        if user_input.lower() in ["exit", "quit", "q"]:
            print("Goodbye! Good luck with the hunt.")
            break
        # We pass the input directly into the flow state
        hunt_flow.kickoff(inputs={"user_input": user_input, "current_date": current_date})

def plot():
    hunt_flow = HuntFlow()
    hunt_flow.plot()


if __name__ == "__main__":
    kickoff()
