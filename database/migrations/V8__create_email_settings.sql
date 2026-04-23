CREATE TABLE email_settings (
    user_id       UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    email         VARCHAR(255) NOT NULL,
    label         VARCHAR(255),
    token_expiry  TIMESTAMP,
    access_token  TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);
