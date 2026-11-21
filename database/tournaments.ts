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

function dbToTournament(
  dbTournament: DBTournament,
  dbTeams: DBTeam[],
  dbMatches: DBMatch[],
): Tournament {
  const teams: { [key: number]: Team } = dbTeams.reduce(
    (acc, v) => ({ [v.id]: v, ...acc }),
    {},
  );

  const dbMatchMap: { [key: number]: DBMatch } = dbMatches.reduce(
    (acc, v) => ({ [v.id]: v, ...acc }),
    {},
  );
  const matchMap: { [key: number]: Match } = dbMatches.reduce(
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

  for (const m of Object.values(matchMap)) {
    if (dbMatchMap[m.id].next_winner !== null)
      m.next_winner = matchMap[dbMatchMap[m.id].next_winner!];
    if (dbMatchMap[m.id].next_loser !== null)
      m.next_loser = matchMap[dbMatchMap[m.id].next_loser!];

    m.previous = Object.values(dbMatchMap)
      .filter((v) => v.next_loser === m.id || v.next_winner === m.id)
      .map((v) => matchMap[v.id]);
  }

  const stage1 = collectStage(
    dbTournament.format1,
    0,
    dbTournament.extra,
    dbMatchMap,
    matchMap,
  );
  const stage2 = dbTournament.format2
    ? collectStage(
        dbTournament.format2,
        1,
        dbTournament.extra,
        dbMatchMap,
        matchMap,
      )
    : null;

  return {
    id: dbTournament.id,
    name: dbTournament.name,
    team_size: dbTournament.team_size,
    state: dbTournament.state as TournamentState,
    stage1,
    stage2,
    current: dbTournament.current
      ? [stage1, stage2][dbTournament.current]
      : null,
  };
}

function collectStage(
  type: string,
  id: number,
  extra: string | null,
  dbMatches: { [key: number]: DBMatch },
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
              dbMatches[m.id].tournament_stage === id &&
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

  const dbTeams = conn
    .prepare<number, DBTeam>("SELECT * FROM teams WHERE tournament_id = ?")
    .all(id);
  const dbMatches = conn
    .prepare<number, DBMatch>("SELECT * FROM matchs WHERE tournament_id = ?")
    .all(id);
  const dbTournament = conn
    .prepare<number, DBTournament>("SELECT * FROM tournaments WHERE id = ?")
    .get(id);

  return dbTournament ? dbToTournament(dbTournament, dbTeams, dbMatches) : null;
}

export async function getTournamentFromName(
  tournamentName: string,
): Promise<Tournament | null> {
  const conn = await open_database();

  const dbTournament = conn
    .prepare<string, DBTournament>("SELECT * FROM tournaments WHERE name = ?")
    .get(tournamentName.toLowerCase().trim());

  if (!dbTournament) return null;

  const dbTeams = conn
    .prepare<number, DBTeam>("SELECT * FROM teams WHERE tournament_id = ?")
    .all(dbTournament.id);
  const dbMatches = conn
    .prepare<number, DBMatch>("SELECT * FROM matchs WHERE tournament_id = ?")
    .all(dbTournament.id);

  return dbToTournament(dbTournament, dbTeams, dbMatches);
}
