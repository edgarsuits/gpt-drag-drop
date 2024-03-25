CREATE TABLE IF NOT EXISTS tutors (
    id text PRIMARY KEY,
    name text NOT NULL,
    content text NOT NULL,
    IsOnline integer,
    follows integer,
    agent_id text
);