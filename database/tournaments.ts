import { throwError } from "@/discord/error";
import { openDatabase } from "./main";
import {
  DBTeam,
  DBTournament,
  type DBEnrollment,
  type DBParticipant,
} from "./model";
import { dbToParticipant, type Participant } from "./participants";
import { Team } from "./teams";

export type TournamentState = "opened" | "started" | "finished";

/**
 * Competition hierarchy:
 * 
 * competition: name, startdate, duration, teams, computeRanks()
 *   |_speedrun: state
 *   |_tournament: state, stage, team_size, match_size
 *     |_single_stage: matches[][]  
 *     | |_knockout: 
 *     | | |_single_elim: 
 *     | | |_double_elim: 
 *     | |_roundrobin: round, match_per_round
 *     | |_manual: 
 *     |_hybrid: stages: single_stage[]
 */

interface Competition {
  name: string ;
  start_date?: Date;
  duration?: number; // represent tournament duration in hour 
  teams: Team[];
}

function dbToTournament(t: DBTournament): Tournament {
    throwError({type: "not_implemented"})
}

export async function getTournament(id: number): Promise<Tournament> {
  const conn = await openDatabase();

  const dbTournament = conn
    .prepare<number, DBTournament>("SELECT * FROM tournaments WHERE id = ?")
    .get(id);

  if (!dbTournament) {
    throwError({ type: "not_found", message: "DB Tournament not found." });
  }

  return dbToTournament(dbTournament);
}

export async function getTournaments(): Promise<Tournament[]> {
  const conn = await openDatabase();

  const dbTournaments = conn
    .prepare<[], DBTournament>("SELECT * FROM tournaments")
    .all();

  return dbTournaments.map(dbToTournament);
}

export async function getTournamentFromName(
  tournamentName: string,
): Promise<Tournament | null> {
  const conn = await openDatabase();

  const dbTournament = conn
    .prepare<string, DBTournament>("SELECT * FROM tournaments WHERE name = ?")
    .get(tournamentName.toLowerCase().trim());

  return dbTournament ? dbToTournament(dbTournament) : null;
}

export async function getTournamentParticipants(
  id: number,
): Promise<Participant[]> {
  const conn = await openDatabase();
  const dbTeams = conn
    .prepare<number, DBTeam>("SELECT * FROM teams WHERE tournament_id = ?")
    .all(id);

  const st_e = conn.prepare<number, DBEnrollment>(
    "SELECT * FROM enrollments WHERE team_id = ?",
  );
  const st_p = conn.prepare<number, DBParticipant>(
    "SELECT * FROM participants WHERE id = ?",
  );

  let dbParticipants: DBParticipant[] = [];
  dbTeams.forEach((t) =>
    st_e
      .all(t.id)
      .forEach((e) => dbParticipants.push(st_p.get(e.participant_id)!)),
  );

  return dbParticipants.map(dbToParticipant);
}

export async function getTournamentsFromParticipantId(
  participant_id: number,
): Promise<Tournament[]> {
  const conn = await openDatabase();
  return conn
    .prepare<number, DBTournament>(
      `SELECT tr.*
    FROM tournaments tr
    JOIN teams t ON t.tournament_id = tr.id
    JOIN enrollments e ON e.team_id = t.id
    WHERE e.participant_id = ?`,
    )
    .all(participant_id)
    .map(dbToTournament);
}

export async function createTournament(t: NewTournament): Promise<number> {
  const conn = await openDatabase();
  return conn
    .prepare(
      "INSERT INTO tournaments(name, role_id, team_size, state, format1, format2) VALUES(?, ?, ?, ?, ?, ?)",
    )
    .run(
      t.name,
      t.role_id,
      t.team_size,
      "opened" as TournamentState,
      t.stage1.type,
      t.stage2?.type,
    ).lastInsertRowid as number;
}

export async function deleteTournament(id: number): Promise<number> {
  const conn = await openDatabase();
  return conn.prepare("DELETE FROM tournaments WHERE id = ?").run(id)
    .lastInsertRowid as number;
}
