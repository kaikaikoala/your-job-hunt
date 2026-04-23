import os

from dotenv import load_dotenv

load_dotenv(".env.local", override=False)

DB_HOST: str = os.environ.get("DB_HOST", "localhost")
DB_PORT: int = int(os.environ.get("DB_PORT", "5432"))
DB_NAME: str = os.environ.get("DB_NAME", "jobhunt")
DB_USER: str = os.environ.get("DB_USER", "jobhunt")
DB_PASSWORD: str = os.environ.get("DB_PASSWORD", "jobhunt")

GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")

GMAIL_CLIENT_ID: str = os.environ.get("GMAIL_CLIENT_ID", "")
GMAIL_CLIENT_SECRET: str = os.environ.get("GMAIL_CLIENT_SECRET", "")
