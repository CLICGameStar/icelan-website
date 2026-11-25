import { Team } from "@/database/teams";
import { Tournament } from "@/database/tournaments";
import { throwError } from "@/discord/error";
import { openDatabase } from "./main";
import { DBMatch, DBTeam } from "./model";

const POWERS = [1, 2, 4, 8, 16, 32, 64, 128];

type GenerationOpts = {
  tournamentId: number;
  count: number;
  stage: number;
};

export async function generateSingleEliminationBracket({
  tournamentId,
  count,
  stage,
}: GenerationOpts) {
  const conn = await openDatabase();
  const insertMatchSt = conn.prepare<
    [number, number, number | null, number | null],
    DBMatch
  >(
    "INSERT INTO matches(tournament_id, tournament_stage, next_winner, next_loser) VALUES (?, ?, ?, ?) RETURNING *",
  );

  const insertMatch = (props: {
    nextWinner?: number;
    nextLoser?: number;
  }): DBMatch =>
    insertMatchSt.get(
      tournamentId,
      stage,
      props.nextWinner || null,
      props.nextLoser || null,
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
}

export async function generateDoubleEliminationBracket({
  count,
  stage,
  tournamentId,
}: GenerationOpts) {
  const conn = await openDatabase();
  const insertMatchSt = conn.prepare<
    [number, number, number | null, number | null],
    DBMatch
  >(
    "INSERT INTO matches(tournament_id, tournament_stage,  next_winner, next_loser) VALUES (?, ?, ?, ?) RETURNING *",
  );

  const insertMatch = (props: {
    nextWinner?: number;
    nextLoser?: number;
  }): DBMatch =>
    insertMatchSt.get(
      tournamentId,
      stage,
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
}

function generateRoundRobinBracket(opts: GenerationOpts) {}

// TODO: shuffle team order
export async function fillTeams(matches: DBMatch[], teams: DBTeam[]) {
  const conn = await openDatabase();
  const updateMatchWinnerSt = conn.prepare<[number | null, number], DBMatch>(
    "UPDATE matches SET next_winner = ? WHERE id = ? RETURNING *",
  );
  const updateMatchLoserSt = conn.prepare<[number | null, number], DBMatch>(
    "UPDATE matches SET next_loser = ? WHERE id = ? RETURNING *",
  );
  const deleteMatchSt = conn.prepare<[number]>(
    "DELETE FROM matches WHERE ID = ?",
  );
  const insertTeamMatch = conn.prepare<[number, number]>(
    "INSERT INTO team_matches(match_id, team_id) VALUES (?, ?)",
  );

  const preds: { [id: string]: number[] } = {};
  for (const m of matches) {
    const addPred = (id: number) => {
      preds[id] = [...(preds[id] || []), m.id];
    };
    if (m.next_winner) addPred(m.next_winner);
    if (m.next_loser) addPred(m.next_loser);
  }

  const matchesMap: { [id: string]: DBMatch } = matches.reduce(
    (acc, v) => ({ ...acc, [v.id]: v }),
    {},
  );
  const lastLayer = matches.filter(
    (m) => !(m.id in preds) || preds[m.id].length == 0,
  );

  const layerMatchCount = lastLayer.length;

  const teamsPerMatch: { [id: string]: DBTeam[] } = {};
  for (let i = 0; i < teams.length; ++i) {
    const matches = lastLayer[i % layerMatchCount];
    if (!(matches.id in teamsPerMatch)) teamsPerMatch[matches.id] = [];
    teamsPerMatch[matches.id].push(teams[i]);
  }

  while (true) {
    const collapsable = Object.values(matchesMap).filter(
      (m) =>
        (teamsPerMatch[m.id.toString()] || []).length +
          (preds[m.id] || []).length <=
        1,
    );
    if (collapsable.length === 0) {
      break;
    }

    for (const m of collapsable) {
      if ((preds[m.id] || []).length > 0) {
        const p = matchesMap[preds[m.id][0]];
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
      delete matchesMap[m.id];
      delete preds[m.id];
      delete teamsPerMatch[m.id];
    }
  }

  for (const matchId of Object.keys(teamsPerMatch)) {
    for (const team of teamsPerMatch[matchId]) {
      insertTeamMatch.run(parseInt(matchId), team.id);
    }
  }
}

export function constructTournamentStages(
  tournament: Tournament,
  teams: Team[],
) {
  const opts1 = {
    count: teams.length,
    tournamentId: tournament.id,
    stage: 0,
    teams,
  };
  switch (tournament.stage1.type) {
    case "single_elimination_bracket":
      generateSingleEliminationBracket(opts1);
      break;

    case "double_elimination_bracket":
      generateDoubleEliminationBracket(opts1);
      break;

    case "round_robin":
      generateRoundRobinBracket(opts1);
      break;

    default:
      throwError({ type: "invalid_data", source: "database" });
      break;
  }
}
