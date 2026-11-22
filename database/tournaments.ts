import { throwError } from "@/discord/error";
import { openDatabase } from "./main";
import { DBMatch, DBTeam, DBTournament } from "./model";
import type { Team } from "./teams";

export type TournamentState = "created" | "opened" | "started" | "finished";

export type PopulatedTournament = {
  id: number;
  name: string;
  team_size: number;
  state: TournamentState;
  stage1: Stage;
  stage2: Stage | null;
  current: Stage | null;
};

export type Tournament = {
  id: number;
  name: string;
  team_size: number;
  state: TournamentState;
  stage1: Stage["type"];
  stage2: Stage["type"] | null;
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

function dbToPopulatedTournament(
  dbTournament: DBTournament,
  dbTeams: DBTeam[],
  dbMatches: DBMatch[],
): PopulatedTournament {
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
    dbTournament.id,
    dbTournament.format1,
    0,
    dbTournament.extra,
    dbMatchMap,
    matchMap,
  );
  const stage2 = dbTournament.format2
    ? collectStage(
        dbTournament.id,
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
  id: number,
  type: string,
  stage: number,
  extra: string | null,
  dbMatches: { [key: number]: DBMatch },
  matches: { [key: number]: Match },
): Stage {
  switch (type) {
    case "single_elimination_bracket":
    case "double_elimination_bracket":
      return {
        type,
        root: matches[
          (
            Object.values(dbMatches).find(
              (m) =>
                dbMatches[m.id].tournament_stage === stage &&
                m.next_winner === null &&
                m.next_loser === null,
            ) ||
            (() => {
              throwError({
                type: "invalid_data",
                source: "database",
                message: `tournament[${stage}] has no root match`,
              });
            })()
          ).id
        ],
      };

    case "round_robin":
      return {
        type,
        matches: Object.values(matches),
        winner_counts: extra
          ? parseInt(extra)
          : (() => {
              throwError({
                type: "invalid_data",
                source: "database",
                message: `tournament[${stage}].extra is not an int`,
              });
            })(),
      };

    default:
      throwError({
        type: "invalid_data",
        source: "database",
        message: `tournament[${stage}].type==${type}`,
      });
  }
}

function dbToTournament(t: DBTournament): Tournament {
  return {
    id: t.id,
    name: t.name,
    team_size: t.team_size,
    state: t.state as TournamentState,
    stage1: t.format1 as Stage["type"],
    stage2: t.format2 as Stage["type"] | null,
  };
}

export async function getPopulatedTournament(
  id: number,
): Promise<PopulatedTournament | null> {
  const conn = await openDatabase();

  const dbTeams = conn
    .prepare<number, DBTeam>("SELECT * FROM teams WHERE tournament_id = ?")
    .all(id);
  const dbMatches = conn
    .prepare<number, DBMatch>("SELECT * FROM matchs WHERE tournament_id = ?")
    .all(id);
  const dbTournament = conn
    .prepare<number, DBTournament>("SELECT * FROM tournaments WHERE id = ?")
    .get(id);

  return dbTournament
    ? dbToPopulatedTournament(dbTournament, dbTeams, dbMatches)
    : null;
}

export async function getPopulatedTournamentFromName(
  tournamentName: string,
): Promise<PopulatedTournament | null> {
  const conn = await openDatabase();

  const dbTournament = conn
    .prepare<string, DBTournament>("SELECT * FROM tournaments WHERE name = ?")
    .get(tournamentName.trim());

  if (!dbTournament) return null;

  const dbTeams = conn
    .prepare<number, DBTeam>("SELECT * FROM teams WHERE tournament_id = ?")
    .all(dbTournament.id);
  const dbMatches = conn
    .prepare<number, DBMatch>("SELECT * FROM matchs WHERE tournament_id = ?")
    .all(dbTournament.id);

  return dbToPopulatedTournament(dbTournament, dbTeams, dbMatches);
}

export async function getTournament(id: number): Promise<Tournament | null> {
  const conn = await openDatabase();

  const dbTournament = conn
    .prepare<number, DBTournament>("SELECT * FROM tournaments WHERE id = ?")
    .get(id);

  return dbTournament ? dbToTournament(dbTournament) : null;
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
