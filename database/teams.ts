import { throwError } from "@/discord/error";
import { open_database } from "./main";
import type { DBEnrollment, DBTeam } from "./model";
import { getParticipant, type Participant } from "./participants";

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

export async function insertTeamInDatabase(t: NewTeam): Promise<number> {
  const conn = await open_database();
  const st = conn.prepare(
    "INSERT INTO teams(name, creator, tournament_id) VALUES(?, ?, ?)",
  );
  return st.run(t.name, t.creator, t.tournament_id).lastInsertRowid as number;
}

export async function getTeam(id: number): Promise<Team> {
  const conn = await open_database();
  const st = conn.prepare<number, DBTeam>("SELECT * FROM teams WHERE id = ?");
  const team = st.get(id);
  if (!team) {
    throwError({ type: "not_found", message: "DB Team not found" });
  }
  return dbToTeam(team);
}

export async function getTeamFromName(name: string): Promise<Team | null> {
  const conn = await open_database();
  const st = conn.prepare<string, DBTeam>("SELECT * FROM teams WHERE name = ?");
  const team = st.get(name.toLowerCase().trim());
  return team ? dbToTeam(team) : null;
}

export async function getTeamMembers(team_id: number): Promise<Participant[]> {
  const conn = await open_database();
  const st = conn.prepare<number, DBEnrollment>(
    "SELECT * FROM enrollments WHERE team_id = ?",
  );
  const enrollments = st.all(team_id);
  return await Promise.all(
    enrollments.map((e) => getParticipant(e.participant_id)),
  );
}
