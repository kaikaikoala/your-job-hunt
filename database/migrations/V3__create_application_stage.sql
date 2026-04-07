CREATE TABLE application_stage (
    app_stage_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id        UUID NOT NULL REFERENCES applications(app_id) ON DELETE CASCADE,
    stage         VARCHAR(100) NOT NULL,
    stage_date    DATE,
    result        VARCHAR(100)
);
