CREATE TABLE IF NOT EXISTS tutors (
    id text PRIMARY KEY,
    user_id integer NOT NULL,
    name text NOT NULL,
    content text NOT NULL,
    IsOnline integer,
    follows integer,
    agent_id text
);