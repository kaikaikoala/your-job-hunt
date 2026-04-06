CREATE TABLE applications (
    app_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          VARCHAR(128) NOT NULL,
    company          VARCHAR(255) NOT NULL,
    role             VARCHAR(255) NOT NULL,
    job_posting_url  VARCHAR(2048),
    referrer_id      UUID REFERENCES network(referrer_id),
    salary_range     VARCHAR(100),
    required_skills  TEXT,
    exp_required     VARCHAR(100),
    UNIQUE (user_id, job_posting_url)
);
