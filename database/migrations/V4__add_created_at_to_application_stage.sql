ALTER TABLE application_stage
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
