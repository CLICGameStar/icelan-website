CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY,
    first_name TEXT NOT NULL,
    family_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    discord_username TEXT NOT NULL,
    discord_id TEXT UNIQUE NOT NULL,
    is_staff INTEGER NOT NULL,
    is_donator INTEGER NOT NULL,
    points INTEGER
);

CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY,
    "name" TEXT NOT NULL,
    creator INTEGER NOT NULL,
    tournament_id INTEGER NOT NULL,
    rank INTEGER,
    confirmed INTEGER NOT NULL,
    UNIQUE (tournament_id, "name"),
    FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE,
    FOREIGN KEY (creator) REFERENCES participants (id),
    FOREIGN KEY (creator, id) REFERENCES enrollments (participant_id, team_id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS enrollments (
    participant_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    PRIMARY KEY (participant_id, team_id),
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY,
    "name" TEXT UNIQUE NOT NULL,
    role_id TEXT UNIQUE NOT NULL,
    team_size INTEGER NOT NULL,
    state TEXT NOT NULL,
    format1 TEXT NOT NULL,
    format2 TEXT,
    current INTEGER,
    extra TEXT
);

CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY,
    tournament_id INTEGER NOT NULL,
    tournament_stage INTEGER NOT NULL,
    next_winner INTEGER,
    next_loser INTEGER,
    FOREIGN KEY (tournament_id) REFERENCES tournaments (id)
);

CREATE TABLE IF NOT EXISTS team_matches (
    match_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    score INTEGER,
    PRIMARY KEY (match_id, team_id),
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS ranking_points(
    number_of_teams INTEGER,
    rank INTEGER,
    points INTEGER,
    PRIMARY KEY (number_of_teams, rank)
);

CREATE TABLE IF NOT EXISTS bonus_points(
    id INTEGER PRIMARY KEY,
    participant_id INTEGER NOT NULL,
    points INTEGER NOT NULL,
    justification TEXT,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);