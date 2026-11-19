CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY,
    first_name TEXT,
    family_name TEXT,
    username TEXT,
    discord_username TEXT UNIQUE,
    discord_id TEXT UNIQUE,
    is_staff INTEGER,
    points INTEGER
);

CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY,
    "name" TEXT NOT NULL,
    creator TEXT NOT NULL,
    tournament_id INTEGER NOT NULL,
    rank INTEGER,
    confirmed INTEGER NOT NULL,
    FOREIGN KEY (tournament_id) REFERENCES tournaments (id) FOREIGN KEY (creator) REFERENCES participants (discord_id)
);

CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY,
    "name" TEXT NOT NULL,
    team_size INTEGER NOT NULL,
    state TEXT NOT NULL,
    format1 TEXT NOT NULL,
    format2 TEXT,
    current INTEGER,
    extra TEXT
);

CREATE TABLE IF NOT EXISTS matchs (
    id INTEGER PRIMARY KEY,
    tournament_id INTEGER NOT NULL,
    tournament_stage INTEGER NOT NULL,
    teams TEXT,
    scores TEXT,
    next_winner INTEGER,
    next_loser INTEGER,
    FOREIGN KEY (tournament_id) REFERENCES tournaments (id)
);
