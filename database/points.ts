import { throwError } from "@/discord/error";
import { openDatabase } from "./main"

export type RankingPoint = {
    number_of_teams: number,
    points: number[]
}

export async function clearRankingPointsTable() {
    const conn = await openDatabase();
    const st = conn.prepare(
        "DELETE FROM ranking_points"
    );
    st.run();
}

export async function insertRankingPoints(rankingPoints: RankingPoint[]) {
    const conn = await openDatabase();
    
    rankingPoints.forEach(rp => {
        if (rp.number_of_teams > rp.points.length) rp.points = rp.points.concat(Array(rp.number_of_teams - rp.points.length).fill(0));

        const stExist = conn.prepare<number, number>(
            "SELECT COUNT(*) c FROM ranking_points WHERE number_of_teams = ?"
        );
        const exists = stExist.get(rp.number_of_teams);
        if (exists.c < 0) throwError({ type: "querry failed" })
        else if (exists.c > 0) {
            console.log("updating");
            const st = conn.prepare(
                "UPDATE ranking_points SET points = ? WHERE number_of_teams = ? AND rank = ?"
            );
            rp.points.forEach(p => {
                st.run(
                    p,
                    rp.number_of_teams,
                    rp.points.indexOf(p),
                )
            });
        } else {
            console.log("inserting");
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

export async function getPoints(): Promise<RankingPoint[]> {
    const conn = await openDatabase();
    const st = conn.prepare(
        "SELECT number_of_teams, rank, points FROM ranking_points"
    );
    let rps: RankingPoint[] = [];
    st.all().forEach(o => {
        let rp = rps.find(e => e.number_of_teams == o.number_of_teams);
        if (rp === undefined) {
            let ps = Array(o.number_of_teams).fill(0);
            ps[o.rank] = o.points;
            rps.push({number_of_teams: o.number_of_teams, points: ps});
        } else rp.points[o.rank] = o.points;
    });
    
    console.log(rps);
    return rps;
}

export async function getPointsForNumberOfTeam(number_of_teams: number): Promise<number[]> {
    if (number_of_teams < 1) throwError({ type: "invalid number_of_team used (< 1)" });

    const conn = await openDatabase();
    const st = conn.prepare<number, number>(
        "SELECT points FROM ranking_points WHERE number_of_teams = ?"
    );
    const ps = st.all(number_of_teams).map(o => o.points);
    
    return ps;
}

export async function getPointsForRankAndNumberOfTeam(number_of_teams: number, rank: number): Promise<number> {
    if (rank < 1) throwError({ type: "invalid rank used (< 1)" });
    if (number_of_teams < 1) throwError({ type: "invalid number_of_team used (< 1)" });
    const conn = await openDatabase();
    const st = conn.prepare<[number, number], number>(
        "SELECT points FROM ranking_points WHERE number_of_teams = ? AND rank = ?"
    );
    const p = st.get(number_of_teams, rank - 1);
    if (p === undefined) throwError({ type: "db_ranking_points_query_failed" });
    return p.points
}

async function testInsertDuplicate(): Promise<Boolean> {
    const conn = await openDatabase();
    let st = conn.prepare(
        "SELECT COUNT(*) size FROM " +
        "(SELECT number_of_teams, rank, points, COUNT(*) c FROM ranking_points GROUP BY number_of_teams, rank, points HAVING c > 1)"
    );
    const duplicates = st.get();
    if (duplicates === undefined) throwError({type: "querry failed"});
    else if (duplicates.size == 0) return true;
    else return false;
}

export async function testRankingPoints() {
    console.log("Starting test of points ###################");
    const rps: RankingPoint[] = [
        {
            number_of_teams: 2,
            points: [10, 5]
        },
        {
            number_of_teams: 3,
            points: [15, 10, 5]
        }
    ];

    const rps2: RankingPoint[] = [
        {
            number_of_teams: 5,
            points: [20, 15, 10, 5]
        }
    ];

    await clearRankingPointsTable();
    await insertRankingPoints(rps);

    // test duplicate insertion
    await insertRankingPoints(rps);
    if (await testInsertDuplicate()) console.log("Test duplicate insert passed")
    else throwError({type: "failed point test"});
    
    // should return 10
    let p = await getPointsForRankAndNumberOfTeam(2, 1);
    if (p != 10) {
        throwError({ type: "failed point test" });
    } else {
        console.log("Test get points correct 1 passed!")
    }

    // should return 5
    p = await getPointsForRankAndNumberOfTeam(3, 3);
    if (p != 5) {
        console.log(p)
        throwError({ type: "failed point test" });
    } else {
        console.log("Test get points correct 2 passed!")
    }

    // test partial insertion
    await insertRankingPoints(rps2);
    p = await getPointsForRankAndNumberOfTeam(5, 3); 
    if (p != 10) {
        throwError({ type: "failed point test" });
    } else console.log("Test partial insert 1 passed!");
    p = await getPointsForRankAndNumberOfTeam(5, 5); 
    if (p != 0) {
        throwError({ type: "failed point test" });
    } else console.log("Test partial insert 2 passed!");

    // should return [15, 10, 5]
    let success = true;
    const expected = [15, 10, 5];
    let ps: number[];
    try {
        ps = await getPointsForNumberOfTeam(3);
    } catch (error) {
        ps = Array();
        success = false
    }
    if (success && ps.length != 3) success = false;
    for (let i = 0; i < ps.length && success; i++) {
        if (ps[i] != expected[i]) success = false; 
    }
    if (success) console.log("Test get points for specific number of team passed!");
    else throwError({type: "failed point test"});

    // should return everything (rps and rps2 concatenated)
    await getPoints();
    
    // should throw error
    try {
        p = await getPointsForRankAndNumberOfTeam(3, -1);
        
        throwError({ type: "failed point test" });
    } catch (error) {
        console.log(error)
    }

    // should throw error
    try {
        p = await getPointsForRankAndNumberOfTeam(4, 4);

        throwError({ type: "failed point test" });
    } catch (error) {
        console.log(error)
    }

    // should throw error
    try {
        p = await getPointsForRankAndNumberOfTeam(3, 5);
        
        throwError({ type: "failed point test" });
    } catch (error) {
        console.log(error)
    }

    console.log("End of tests for points ###################");
}
