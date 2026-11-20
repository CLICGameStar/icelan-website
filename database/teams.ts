import { throwError } from "@/discord/error";
import { open_database } from "./main";
import type { DBTeam } from "./model";

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
