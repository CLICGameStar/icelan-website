import { throwError } from "@/discord/error";
import { openDatabase } from "./main";
import type { DBEnrollment, DBParticipant, DBTeam } from "./model";
import { dbToParticipant, type Participant } from "./participants";

export type NewTeam = {
  name: string;
  creator: number;
  tournament_id: number;
};

export type Team = NewTeam & {
  id: number;
  rank: number | null;
  confirmed: boolean;
};

export type Enrollment = DBEnrollment;

function dbToTeam(dbt: DBTeam): Team {
  return { ...dbt, confirmed: dbt.confirmed == 1 };
}

export async function createTeam(t: NewTeam): Promise<number> {
  const conn = await openDatabase();

  const insert = conn.transaction((t: NewTeam) => {
    const { lastInsertRowid } = conn
      .prepare(
        "INSERT INTO teams(name, creator, tournament_id, confirmed) VALUES(?, ?, ?, 0)",
      )
      .run(t.name, t.creator, t.tournament_id);

    conn
      .prepare(`INSERT INTO enrollments (participant_id, team_id) VALUES(?, ?)`)
      .run(t.creator, lastInsertRowid);

    return Number(lastInsertRowid);
  });

  return insert(t);
}

export async function deleteTeam(id: number) {
  const conn = await openDatabase();
  conn.prepare("DELETE FROM teams WHERE id = ?").run(id);
}

export async function insertEnrollment(e: Enrollment): Promise<number> {
  const conn = await openDatabase();
  const st = conn.prepare(
    "INSERT INTO enrollments(participant_id, team_id) VALUES(?, ?)",
  );
  return st.run(e.participant_id, e.team_id).lastInsertRowid as number;
}

export async function getTeam(id: number): Promise<Team> {
  const conn = await openDatabase();
  const st = conn.prepare<number, DBTeam>(`
    SELECT t.*
    FROM teams t
    JOIN tournaments tr ON tr.id = t.tournament_id
    WHERE tr.team_size > 1
     AND t.id = ?`);

  const team = st.get(id);
  if (!team) {
    throwError({ type: "not_found", message: "DB Team not found" });
  }
  return dbToTeam(team);
}

export async function getTeams(): Promise<Team[]> {
  const conn = await openDatabase();
  const st = conn.prepare<[], DBTeam>(`
    SELECT t.*
    FROM teams t
    JOIN tournaments tr ON tr.id = t.tournament_id
    WHERE tr.team_size > 1`);
  const teams = st.all();
  return teams.map(dbToTeam);
}

export async function getTeamsFromTournamentId(
  tournament_id: number,
): Promise<Team[]> {
  const conn = await openDatabase();
  return conn
    .prepare<number, DBTeam>("SELECT * FROM teams WHERE tournament_id = ?")
    .all(tournament_id)
    .map(dbToTeam);
}

export async function getTeamsFromParticpantId(
  participant_id: number,
): Promise<Team[]> {
  const conn = await openDatabase();
  return conn
    .prepare<number, DBTeam>(
      `SELECT t.*
       FROM teams t
       JOIN enrollments e ON e.team_id = t.id
       JOIN tournaments tr ON tr.id = t.tournament_id
       WHERE e.participant_id = ?
        AND tr.team_size > 1`,
    )
    .all(participant_id)
    .map(dbToTeam);
}

export async function getTeamsForTournament(id: number): Promise<Team[]> {
  const conn = await openDatabase();
  const st = conn.prepare<number, DBTeam>(
    "SELECT * FROM teams WHERE tournament_id = ?",
  );
  const teams = st.all(id);
  return teams.map(dbToTeam);
}

export async function getTeamFromNameAndTournamentName(
  team_name: string,
  tournament_name: string,
): Promise<Team | null> {
  const conn = await openDatabase();
  const team = conn
    .prepare<[string, string], DBTeam>(
      `
      SELECT t.*
      FROM teams t
      JOIN tournaments tr ON tr.id = t.tournament_id
      WHERE t.name = ?
       AND tr.name = ?
       AND tr.team_size > 1`,
    )
    .get(team_name.trim(), tournament_name.trim());
  return team ? dbToTeam(team) : null;
}

export async function getTeamFromTournamentNameAndCreator(
  tournament_name: string,
  creator_id: number,
): Promise<Team | null> {
  const conn = await openDatabase();
  const team = conn
    .prepare<[number, string], DBTeam>(
      `
      SELECT t.*
      FROM teams t
      JOIN tournaments tr ON tr.id = t.tournament_id
      WHERE t.creator = ?
       AND tr.name = ?
       AND tr.team_size > 1`,
    )
    .get(creator_id, tournament_name.trim());
  return team ? dbToTeam(team) : null;
}

export async function getTeamMembers(team_id: number): Promise<Participant[]> {
  const conn = await openDatabase();

  return conn
    .prepare<number, DBParticipant>(
      `SELECT p.*
      FROM participants p
      JOIN enrollments e ON e.participant_id = p.id
      WHERE e.team_id = ?`,
    )
    .all(team_id)
    .map(dbToParticipant);
}

export async function deleteEnrollment(
  participant_id: number,
  team_id: number,
) {
  const conn = await openDatabase();
  const st = conn.prepare(
    "DELETE FROM enrollments WHERE participant_id = ? AND team_id = ?",
  );
  return st.run(participant_id, team_id);
}
