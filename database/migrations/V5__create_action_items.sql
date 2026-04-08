CREATE TABLE action_items (
    action_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        VARCHAR(128) NOT NULL,
    app_id         UUID REFERENCES applications(app_id) ON DELETE SET NULL,
    referrer_id    UUID REFERENCES network(referrer_id) ON DELETE SET NULL,
    description    TEXT NOT NULL,
    status         VARCHAR(50) NOT NULL DEFAULT 'open',
    due_date       DATE,
    create_date    TIMESTAMP NOT NULL DEFAULT now()
);
