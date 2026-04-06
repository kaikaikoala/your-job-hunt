CREATE TABLE network (
    referrer_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      VARCHAR(128) NOT NULL,
    name         VARCHAR(255) NOT NULL,
    type         VARCHAR(100)
);
