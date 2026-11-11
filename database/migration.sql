CREATE TABLE IF NOT EXISTS participants(
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE,
    first_name TEXT,
    family_name TEXT,
    username TEXT,
    discord_username TEXT UNIQUE,
    discord_id TEXT UNIQUE
);