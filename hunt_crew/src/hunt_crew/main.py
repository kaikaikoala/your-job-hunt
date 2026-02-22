#!/usr/bin/env python
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

from hunt_crew.crew import HuntCrew

# Load environment variables from .env
load_dotenv()

def run():
    print("=== Job Hunt Tracker CLI ===")
    print("Type 'exit' to quit.\n")

    # Instantiate the HuntCrew and the Crew object
    hunt_crew = HuntCrew()
    crew = hunt_crew.crew()

    while True:
        try:
            user_input = input("> ").strip()
            if user_input.lower() in ["exit", "quit"]:
                print("Exiting Job Hunt Tracker CLI.")
                break

            # Kickoff the crew with user input
            result = crew.kickoff(inputs={"user_input": user_input})

            # Print the final structured result
            print("\nAssistant:")
            print(result)
            print()

        except KeyboardInterrupt:
            print("\nExiting Job Hunt Tracker CLI.")
            break
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)

if __name__ == "__main__":
    run()
