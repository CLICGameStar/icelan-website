import { throwError } from "@/discord/error";
import { open_database } from "./main";
import { DBMatch, DBTeam, DBTournament } from "./model";
import type { Team } from "./teams";

export type TournamentState = "created" | "opened" | "started" | "finished";

export type Tournament = {
  id: number;
  name: string;
  team_size: number;
  state: TournamentState;
  stage1: Stage;
  stage2: Stage | null;
  current: Stage | null;
};

export type SingleEliminationBracket = {
  type: "single_elimination_bracket";
  root: Match;
};

export type DoubleEliminationBracket = {
  type: "double_elimination_bracket";
  root: Match;
};

export type RoundRobin = {
  type: "round_robin";
  matches: Match[];
  winner_counts: number;
};

export type Stage =
  | SingleEliminationBracket
  | DoubleEliminationBracket
  | RoundRobin;

export type Match = {
  id: number;
  tournament_id: number;
  teams: Team[] | null;
  scores: number[] | null;
  next_winner: Match | null;
  next_loser: Match | null;
  previous: Match[] | null;
};

function dbToTournament(dbt: DBTournament): Promise<Tournament> {
  throwError({
    type: "not_implemented",
    message: "dbToTournament not implemented",
  });
}

function collectStage(
  type: string,
  id: number,
  extra: string | null,
  db_matches: { [key: number]: DBMatch },
  matches: { [key: number]: Match },
): Stage {
  switch (type) {
    case "single_elimination_bracket":
    case "double_elimination_bracket":
      return {
        type,
        root:
          Object.values(matches).find(
            (m) =>
              db_matches[m.id].tournament_stage === id &&
              m.next_winner === null &&
              m.next_loser === null,
          ) ||
          (() => {
            throw Error();
          })(),
      };

    case "round_robin":
      return {
        type,
        matches: Object.values(matches),
        winner_counts: extra
          ? parseInt(extra)
          : (() => {
              throw new Error();
            })(),
      };

    default:
      throw Error();
  }
}

export async function getTournament(id: number): Promise<Tournament | null> {
  const conn = await open_database();

  const db_teams = conn
    .prepare<number, DBTeam>("SELECT * FROM teams WHERE tournament_id = ?")
    .all(id);
  const db_matchs = conn
    .prepare<number, DBMatch>("SELECT * FROM matchs WHERE tournament_id = ?")
    .all(id);
  const tournament = conn
    .prepare<number, DBTournament>("SELECT * FROM tournaments WHERE id = ?")
    .get(id);

  if (tournament === undefined) {
    throw Error();
  }

  const teams: { [key: number]: Team } = db_teams.reduce(
    (acc, v) => ({ [v.id]: v, ...acc }),
    {},
  );

  const db_match_map: { [key: number]: DBMatch } = db_matchs.reduce(
    (acc, v) => ({ [v.id]: v, ...acc }),
    {},
  );
  const match_map: { [key: number]: Match } = db_matchs.reduce(
    (acc, v) => ({
      [v.id]: {
        id: v.id,
        tournament_id: v.tournament_id,
        teams: v.teams?.split(":").map((v) => teams[parseInt(v)]),
        scores: v.score?.split(":")?.map(parseInt),
      },
      ...acc,
    }),
    {},
  );

  for (const m of Object.values(match_map)) {
    if (db_match_map[m.id].next_winner !== null)
      m.next_winner = match_map[db_match_map[m.id].next_winner!];
    if (db_match_map[m.id].next_loser !== null)
      m.next_loser = match_map[db_match_map[m.id].next_loser!];

    m.previous = Object.values(db_match_map)
      .filter((v) => v.next_loser === m.id || v.next_winner === m.id)
      .map((v) => match_map[v.id]);
  }

  const stage1 = collectStage(
    tournament.format1,
    0,
    tournament.extra,
    db_match_map,
    match_map,
  );
  const stage2 = tournament.format2
    ? collectStage(
        tournament.format2,
        1,
        tournament.extra,
        db_match_map,
        match_map,
      )
    : null;

  return {
    id: tournament.id,
    name: tournament.name,
    team_size: tournament.team_size,
    state: tournament.state as TournamentState,
    stage1,
    stage2,
    current: tournament.current ? [stage1, stage2][tournament.current] : null,
  };
}

export async function getTournamentFromName(
  tournament_name: string,
): Promise<Tournament | null> {
  const conn = await open_database();
  const st = conn.prepare<string, DBTournament>(
    "SELECT * FROM teams WHERE name = ?",
  );
  const team = st.get(tournament_name) ?? null;
  return team ? dbToTournament(team) : null;
}
