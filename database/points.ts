import { throwError } from "@/discord/error";
import { open_database } from "./main"

export type RankingPoint = {
    number_of_teams: number,
    points: number[]
}

export async function insertRankingPoints(rankingPoints: RankingPoint[]) {
    const conn = await open_database();
    
    rankingPoints.forEach(rp => {
        const stExist = conn.prepare<number, number>(
            "SELECT COUNT(*) FROM ranking_points WHERE number_of_teams = ?"
        );
        const exists = stExist.get(rp.number_of_teams);
        if (exists != 0) {
            const st = conn.prepare(
                
            );
        } else {
            const st = conn.prepare(
                "INSERT INTO ranking_points(number_of_teams, rank, points) VALUES(?, ?, ?)"
            );
            rp.points.forEach(p => {
                st.run(
                    rp.number_of_teams,
                    rp.points.indexOf(p),
                    p
                )
            });
        }
    });
}

export async function getPointsForRankAndNumberOfTeam(number_of_teams: number, rank: number): Promise<number> {
    if (rank < 1) throwError({ type: "invalid rank used (< 1)" });
    if (number_of_teams < 1) throwError({ type: "invalid number_of_team used (< 1)" });
    const conn = await open_database();
    const st = conn.prepare<[number, number], number>(
        "SELECT points FROM results_points WHERE number_of_teams = ? AND rank = ?"
    );
    const p = st.get(number_of_teams, rank - 1);
    if (p === undefined) throwError({ type: "db_ranking_points_query_failed" });
    return p.points
}