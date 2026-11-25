import { openDatabase } from "./main";
import type { NewTeam } from "./teams";

export async function register(
  participant_id: number,
  tournament_id: number,
): Promise<number> {
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

  return insert({
    name: `${participant_id}_${tournament_id}`,
    creator: participant_id,
    tournament_id: tournament_id,
  });
}

export async function unregister(
  participant_id: number,
  tournament_id: number,
) {
  const conn = await openDatabase();
  conn
    .prepare(
      `DELETE FROM teams
       WHERE tournament_id = ?
         AND id IN (SELECT team_id FROM enrollments WHERE participant_id = ?)
         AND EXISTS (
           SELECT 1 FROM tournaments
           WHERE id = teams.tournament_id AND team_size = 1
         )`,
    )
    .run(tournament_id, participant_id);
}
