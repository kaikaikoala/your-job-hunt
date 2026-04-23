CREATE TABLE email_syncs (
    sync_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status           VARCHAR(20) NOT NULL DEFAULT 'running',
    started_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at     TIMESTAMP,
    emails_fetched   INT,
    emails_processed INT,
    error_message    TEXT
);

CREATE UNIQUE INDEX one_running_sync_per_user
    ON email_syncs (user_id)
    WHERE status = 'running';
