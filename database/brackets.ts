import { Team } from "@/database/teams";
import {
  PopulatedTournament,
  PopulatedStage,
  Tournament,
  Match,
} from "@/database/tournaments";
import { throwError } from "@/discord/error";
import { openDatabase } from "./main";
import { DBMatch, DBTournament } from "./model";

const POWERS = [1, 2, 4, 8, 16, 32, 64, 128];

export async function generateSingleEliminationBracket({
  tournamentId,
  count,
  stage,
  ...opts
}: {
  tournamentId: number;
  count: number;
  stage: number;
  teams?: Team[];
}) {
  const conn = await openDatabase();
  const insertMatchSt = conn.prepare<
    [number, number, string | null, number | null, number | null],
    DBMatch
  >(
    "INSERT INTO matches(tournament_id, tournament_stage, teams, scores, next_winner, next_loser) VALUES (?, ?, ?, NULL, ?, ?) RETURNING *",
  );
  const updateMatchSt = conn.prepare<[string | null, number], DBMatch>(
    "UPDATE matches SET teams = ? WHERE id = ? RETURNING *",
  );
  const deleteMatchSt = conn.prepare<[number]>(
    "DELETE FROM matches WHERE ID = ?",
  );

  const insertMatch = (props: {
    teams?: Team[];
    nextWinner?: number;
    nextLoser?: number;
  }): DBMatch =>
    insertMatchSt.get(
      tournamentId,
      stage,
      props.teams ? props.teams.map((t) => t.id.toString()).join(":") : null,
      props.nextWinner || null,
      props.nextLoser || null,
    )!;
  const updateMatch = (props: { id: number; teams?: Team[] }): DBMatch =>
    updateMatchSt.get(
      props.teams ? props.teams.map((t) => t.id.toString()).join(":") : null,
      props.id,
    )!;

  const depth = POWERS.indexOf(POWERS.filter((v) => v >= count)[0]) - 1;

  let root = insertMatch({});
  let allMatches: DBMatch[] = [root];
  let nextLayer: DBMatch[] = allMatches;

  for (let l = 0; l < depth; ++l) {
    const layer = Array.from({ length: 2 * nextLayer.length }, (v, i) =>
      insertMatch({
        nextWinner: nextLayer[Math.floor(i / 2)].id,
      }),
    );
    allMatches = [...allMatches, ...layer];
    nextLayer = layer;
  }

  const lastLayer = nextLayer;

  if (opts.teams) {
    const teams = opts.teams;
    const layerMatchCount = lastLayer.length;

    const teamsPerMatch: { [id: number]: Team[] } = {};
    for (let i = 0; i < teams.length; ++i) {
      const matches = lastLayer[i % layerMatchCount];
      if (!(matches.id in teamsPerMatch)) teamsPerMatch[matches.id] = [];
      teamsPerMatch[matches.id].push(teams[i]);
    }

    for (const matches of lastLayer) {
      const matchTeams = teamsPerMatch[matches.id];
      if (matchTeams.length > 1) {
        updateMatch({ id: matches.id, teams: teamsPerMatch[matches.id] });
      } else {
        if (matchTeams.length == 1) {
          teamsPerMatch[matches.next_winner!] = [
            ...(teamsPerMatch[matches.next_winner!] || []),
            ...matchTeams,
          ];

          updateMatch({
            id: matches.next_winner!,
            teams: teamsPerMatch[matches.next_winner!],
          });
        }

        deleteMatchSt.run(matches.id);
      }
    }
  }
}

export async function generateDoubleEliminationBracket({
  count,
  stage,
  tournamentId,
  ...opts
}: {
  count: number;
  stage: number;
  tournamentId: number;
  teams?: Team[];
}) {
  const conn = await openDatabase();
  const insertMatchSt = conn.prepare<
    [number, number, string | null, number | null, number | null],
    DBMatch
  >(
    "INSERT INTO matches(tournament_id, tournament_stage, teams, scores, next_winner, next_loser) VALUES (?, ?, ?, NULL, ?, ?) RETURNING *",
  );
  const updateMatchTeamsSt = conn.prepare<[string | null, number], DBMatch>(
    "UPDATE matches SET teams = ? WHERE id = ? RETURNING *",
  );
  const updateMatchWinnerSt = conn.prepare<[number | null, number], DBMatch>(
    "UPDATE matches SET next_winner = ? WHERE id = ? RETURNING *",
  );
  const updateMatchLoserSt = conn.prepare<[number | null, number], DBMatch>(
    "UPDATE matches SET next_loser = ? WHERE id = ? RETURNING *",
  );
  const deleteMatchSt = conn.prepare<[number]>(
    "DELETE FROM matches WHERE ID = ?",
  );

  const insertMatch = (props: {
    teams?: Team[];
    nextWinner?: number;
    nextLoser?: number;
  }): DBMatch =>
    insertMatchSt.get(
      tournamentId,
      stage,
      props.teams ? props.teams.map((t) => t.id.toString()).join(":") : null,
      props.nextWinner || null,
      props.nextLoser || null,
    )!;

  const depth = POWERS.indexOf(POWERS.filter((v) => v >= count)[0]) - 1;

  let root = insertMatch({});
  let loserRoot = insertMatch({ nextWinner: root.id });
  let winnerRoot = insertMatch({
    nextWinner: root.id,
    nextLoser: loserRoot.id,
  });

  let allMatches: DBMatch[] = [root, winnerRoot, loserRoot];
  let winnerNextLayer: DBMatch[] = [winnerRoot];
  let loserNextLayer: DBMatch[] = [loserRoot];

  for (let l = 0; l < depth; ++l) {
    const loserUpperLayer = Array.from(
      { length: loserNextLayer.length },
      (v, i) =>
        insertMatch({
          nextWinner: loserNextLayer[i].id,
        }),
    );

    const loserLayer = Array.from(
      { length: 2 * loserUpperLayer.length },
      (v, i) =>
        insertMatch({
          nextWinner: loserUpperLayer[Math.floor(i / 2)].id,
        }),
    );

    const winnerLayer = Array.from(
      { length: 2 * winnerNextLayer.length },
      (v, i) =>
        insertMatch({
          nextWinner: winnerNextLayer[Math.floor(i / 2)].id,
          nextLoser: loserLayer[i].id,
        }),
    );

    allMatches = [
      ...allMatches,
      ...loserUpperLayer,
      ...loserLayer,
      ...winnerLayer,
    ];
    winnerNextLayer = winnerLayer;
    loserNextLayer = loserLayer;
  }

  const lastLayer = winnerNextLayer;
  const matches: { [id: string]: DBMatch } = allMatches.reduce(
    (acc, v) => ({ ...acc, [v.id]: v }),
    {},
  );
  if (opts.teams) {
    const teams = opts.teams;
    const layerMatchCount = lastLayer.length;

    const teamsPerMatch: { [id: string]: Team[] } = {};
    for (let i = 0; i < teams.length; ++i) {
      const matches = lastLayer[i % layerMatchCount];
      if (!(matches.id in teamsPerMatch)) teamsPerMatch[matches.id] = [];
      teamsPerMatch[matches.id].push(teams[i]);
    }

    const preds: { [id: string]: number[] } = {};
    for (const m of allMatches) {
      const addPred = (id: number) => {
        preds[id] = [...(preds[id] || []), m.id];
      };
      if (m.next_winner) addPred(m.next_winner);
      if (m.next_loser) addPred(m.next_loser);
    }
    console.log(preds);
    console.log(teamsPerMatch);

    while (true) {
      console.log("flowchart LR");
      for (const m of Object.values(matches)) {
        if (m.next_winner) {
          console.log(`    ${m.id} --> ${m.next_winner}`);
        }
        if (m.next_loser) {
          console.log(`    ${m.id} .-> ${m.next_loser}`);
        }
      }

      const collapsable = Object.values(matches).filter(
        (m) =>
          (teamsPerMatch[m.id.toString()] || []).length +
            (preds[m.id] || []).length <=
          1,
      );
      console.log(collapsable);
      if (collapsable.length === 0) {
        break;
      }

      for (const m of collapsable) {
        if ((preds[m.id] || []).length > 0) {
          const p = matches[preds[m.id][0]];
          if (p.next_winner === m.id) {
            p.next_winner = m.next_winner;
            updateMatchWinnerSt.run(m.next_winner, p.id);
          }
          if (p.next_loser === m.id) {
            p.next_loser = m.next_winner;
            updateMatchLoserSt.run(m.next_winner, p.id);
          }

          if (m.next_winner) {
            preds[m.next_winner] = [
              ...preds[m.next_winner].filter((v) => v !== m.id),
              p.id,
            ];
          }
          if (m.next_loser) {
            preds[m.next_loser] = [
              ...preds[m.next_loser].filter((v) => v !== m.id),
              p.id,
            ];
          }
        } else if ((teamsPerMatch[m.id] || []).length > 0) {
          teamsPerMatch[m.next_winner!] = [
            ...teamsPerMatch[m.id],
            ...(teamsPerMatch[m.next_winner!] || []),
          ];
        }

        deleteMatchSt.run(m.id);
        delete matches[m.id];
        delete preds[m.id];
        delete teamsPerMatch[m.id];
      }
    }

    for (const kv of Object.keys(teamsPerMatch)) {
      updateMatchTeamsSt.run(
        teamsPerMatch[kv].map((v) => v.id).join(":"),
        parseInt(kv),
      );
    }
  }
}

function generateRoundRobinBracket(
  tournamentId: number,
  teams: Team[],
  winnerCount: number,
): PopulatedStage<true> {}

function constructTournament(
  tournament: Tournament,
  teams: Team[],
): PopulatedTournament<true> {
  let stage1: PopulatedStage<true>;
  let stage2: PopulatedStage<true> | null = null;

  switch (tournament.stage1.type) {
    case "single_elimination_bracket":
      stage1 = generateSingleEliminationBracket({
        count: teams.length,
        tournamentId: tournament.id,
        teams,
      });
      break;

    case "double_elimination_bracket":
      stage1 = generateDoubleEliminationBracket({
        count: teams.length,
        tournamentId: tournament.id,
        teams,
      });
      break;

    case "round_robin":
      stage1 = generateRoundRobinBracket(
        tournament.id,
        teams,
        tournament.stage1.winnerCount,
      );
      break;

    default:
      throwError({ type: "invalid_data", source: "database" });
      break;
  }
}
