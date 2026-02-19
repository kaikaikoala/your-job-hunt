#!/usr/bin/env python
import sys
import warnings
from datetime import datetime

from ratelimit import limits, sleep_and_retry

from hunt_crew.crew import HuntCrew

warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

# -------------------------------
# Rate Limiter Configuration
# -------------------------------
# Adjust these values based on your token/API quota
CALLS_PER_MINUTE = 2  # maximum Crew kickoff calls per minute
PERIOD_SECONDS = 60


@sleep_and_retry
@limits(calls=CALLS_PER_MINUTE, period=PERIOD_SECONDS)
def limited_kickoff(crew, inputs):
    """
    Wrapper around Crew.kickoff to enforce rate limiting.
    """
    return crew.kickoff(inputs)


# -------------------------------
# CLI Loop
# -------------------------------
def run():
    """
    Runs the Job Hunt Tracker CLI with rate limiting.
    """
    print("\n=== Job Hunt Tracker CLI ===")
    print("Type 'exit' to quit.\n")

    hunt_crew = HuntCrew()
    crew = hunt_crew.crew()

    while True:
        try:
            user_input = input("You: ").strip()

            if user_input.lower() in ["exit", "quit"]:
                print("Good luck with your job hunt! 🚀")
                break

            if not user_input:
                continue

            # Kickoff with rate limiting
            result = limited_kickoff(
                crew,
                inputs={
                    "user_input": user_input,
                    "current_date": datetime.now().strftime("%Y-%m-%d"),
                },
            )

            print("\nAssistant:")
            print(result)
            print()

        except KeyboardInterrupt:
            print("\nExiting...")
            sys.exit(0)

        except Exception as e:
            print(f"\nError: {str(e)}\n")


if __name__ == "__main__":
    run()
