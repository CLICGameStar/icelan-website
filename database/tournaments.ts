import { throwError } from "@/discord/error";
import { openDatabase } from "./main";
import {
  DBMatch,
  DBTeam,
  DBTournament,
  type DBEnrollment,
  type DBParticipant,
} from "./model";
import { dbToParticipant, type Participant } from "./participants";
import type { Team } from "./teams";

export type TournamentState = "opened" | "started" | "finished";

// T: set to true when this is a newly populated tournament (matches don't exist in DB yet, so no id)
export type PopulatedTournament = {
  id: number;
  name: string;
  team_size: number;
  state: TournamentState;
  stage1: PopulatedStage;
  stage2: PopulatedStage | null;
  current: PopulatedStage | null;
};

export type NewTournament = {
  name: string;
  team_size: number;
  stage1: Stage;
  stage2: Stage | null;
};

export type Tournament = {
  id: number;
  state: TournamentState;
} & NewTournament;

export type SingleEliminationBracket = {
  type: "single_elimination_bracket";
};
export type PopulatedSingleEliminationBracket = SingleEliminationBracket & {
  root: Match;
};

export type DoubleEliminationBracket = {
  type: "double_elimination_bracket";
};
export type PopulatedDoubleEliminationBracket = DoubleEliminationBracket & {
  root: Match;
};

export type RoundRobin = {
  type: "round_robin";
  winnerCount: number;
};
export type PopulatedRoundRobin = RoundRobin & {
  matches: Match[];
};

export type StageType = Stage["type"];

export type PopulatedStage =
  | PopulatedSingleEliminationBracket
  | PopulatedDoubleEliminationBracket
  | PopulatedRoundRobin;
export type Stage =
  | SingleEliminationBracket
  | DoubleEliminationBracket
  | RoundRobin;

export type Match = {
  id: number;
  tournamentId: number;
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
): PopulatedStage {
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
                message: `tournament[${stage}] has no root matches`,
              });
            })()
          ).id
        ],
      };

    case "round_robin":
      return {
        type,
        matches: Object.values(matches),
        winnerCount: extra
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

function mapStage(format: StageType, extra: string | null): Stage {
  return format === "round_robin"
    ? {
        type: format,
        winnerCount: parseInt(
          extra ||
            throwError({
              type: "invalid_data",
              source: "database",
              message: "missing extra for round_robin tournament",
            }),
        ),
      }
    : { type: format };
}

function dbToTournament(t: DBTournament): Tournament {
  return {
    id: t.id,
    name: t.name,
    team_size: t.team_size,
    state: t.state as TournamentState,
    stage1: mapStage(t.format1 as StageType, t.extra),
    stage2: t.format2 ? mapStage(t.format2 as StageType, t.extra) : null,
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
    .prepare<number, DBMatch>("SELECT * FROM matches WHERE tournament_id = ?")
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
    .prepare<number, DBMatch>("SELECT * FROM matches WHERE tournament_id = ?")
    .all(dbTournament.id);

  return dbToPopulatedTournament(dbTournament, dbTeams, dbMatches);
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
      "INSERT INTO tournaments(name, team_size, state, format1, format2) VALUES(?, ?, ?, ?, ?)",
    )
    .run(
      t.name,
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
