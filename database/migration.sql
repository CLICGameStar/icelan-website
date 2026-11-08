CREATE TABLE IF NOT EXISTS participants(
    id INTEGER PRIMARY KEY,
    username TEXT,
    discord_username TEXT UNIQUE
);