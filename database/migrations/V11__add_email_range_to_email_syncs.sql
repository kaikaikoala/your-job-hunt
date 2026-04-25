ALTER TABLE email_syncs ADD COLUMN first_email_timestamp TIMESTAMP;
ALTER TABLE email_syncs ADD COLUMN last_email_timestamp TIMESTAMP;
ALTER TABLE email_syncs ADD COLUMN application_updates INT;
