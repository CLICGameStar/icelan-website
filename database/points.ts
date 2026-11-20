import { throwError } from "@/discord/error";
import { open_database } from "./main"

export type RankingPoint = {
    number_of_teams: number,
    points: number[]
}

export async function insertRankingPoints(rankingPoints: RankingPoint[]) {
    console.log("hi")
    const conn = await open_database();
    console.log("bob")
    const st = conn.prepare(
        "INSERT INTO ranking_points(number_of_teams, rank, points) VALUES(?, ?, ?)"
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

export async function getPointsForRankAndNumberOfTeam(number_of_teams: number, rank: number): Promise<number> {
    const conn = await open_database();
    const st = conn.prepare<[number, number], number>(
        "SELECT points FROM results_points WHERE number_of_teams = ? AND rank = ?"
    );
    return st.get(number_of_teams, rank) ?? throwError({ type: "db_ranking_points_query_failed"}); 
}