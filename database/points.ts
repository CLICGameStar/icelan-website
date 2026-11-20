import { throwError } from "@/discord/error";
import { open_database } from "./main"

export type RankingPoint = {
    number_of_teams: number,
    points: number[]
}

export async function insertRankingPoints(rankingPoints: RankingPoint[]) {
    const conn = await open_database();
    const st = conn.prepare(
        "INSERT INTO results_points(number_of_teams, rank, points) VALUES(?, ?, ?)"
    );
    rankingPoints.forEach(rp => {
        rp.points.forEach(p => {
            st.run(
                rp.number_of_teams,
                rp.points.indexOf(p),
                p
            )
        })
    });
}

export async function getPointsForRank(number_of_teams: number, rank: number): Promise<number> {
    const conn = await open_database();
    const st = conn.prepare<[number, number], number>(
        "SELECT points FROM results_points WHERE number_of_teams = ? AND rank = ?"
    );
    return st.get(number_of_teams, rank) ?? throwError(); 
}