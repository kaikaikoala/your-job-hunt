ALTER TABLE applications ADD CONSTRAINT unique_user_job_url UNIQUE (user_id, job_posting_url);
