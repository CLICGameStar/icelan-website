CREATE TABLE IF NOT EXISTS participants(
    id INTEGER PRIMARY KEY,
    first_name TEXT,
    family_name TEXT,
    username TEXT,
    discord_username TEXT UNIQUE,
    discord_id TEXT UNIQUE,
    is_staff INTEGER,
    points INTEGER
);