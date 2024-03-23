CREATE TABLE IF NOT EXISTS agents (
    id text PRIMARY KEY,
    tutor_id text NOT NULL,
    shared_data text NOT NULL,
    model text NOT NULL,
    problems text
);