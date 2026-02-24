-- Enable Foreign Key support
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS network (
    referrer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT -- e.g., 'friend', 'recruiter'
);

CREATE TABLE IF NOT EXISTS applications (
    app_id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    job_posting_url TEXT UNIQUE,
    referrer_id INTEGER,
    salary_range TEXT,
    skills_required TEXT,
    experience_required TEXT,
    FOREIGN KEY(referrer_id) REFERENCES network(referrer_id)
);

CREATE TABLE IF NOT EXISTS application_stage (
    app_stage_id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id INTEGER NOT NULL,
    stage TEXT NOT NULL,
    stage_date TEXT NOT NULL,
    result TEXT,
    FOREIGN KEY(app_id) REFERENCES applications(app_id)
);

CREATE TABLE IF NOT EXISTS action_items (
    action_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id INTEGER,
    referrer_id INTEGER,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    due_date TEXT,
    create_date TEXT NOT NULL,
    FOREIGN KEY(app_id) REFERENCES applications(app_id),
    FOREIGN KEY(referrer_id) REFERENCES network(referrer_id)
);
