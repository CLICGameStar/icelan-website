import { throwError } from "@/discord/error";
import { openDatabase } from "./main";
import { DBMatch, DBTeam } from "./model";
import { dbToTeam, Team } from "./teams";
import { notify } from "@/discord/logging";

export async function getTeamsInMatch(match_id: number): Promise<Team[]> {
    return (await openDatabase()).prepare<number, DBTeam>(
        "SELECT * FROM team_matches WHERE match_id = ?"
    ).all(match_id).map(dbToTeam);
}

export async function notifyMatchParticipant(match: DBMatch, match_size: number, tournament_name: string) {
    const teamInMatch = await getTeamsInMatch(match.id);
    if (teamInMatch.length != match_size) throwError({
        type: "invalid_data",
        source: "other",
        message: `Wrong number of team in match ${match.id}. Expected ${match_size}, got ${teamInMatch.length}`,
    });

    for (let j = 0; j < teamInMatch.length; j++) {
        const opponentString = teamInMatch.filter(t => t != teamInMatch[j]).map(t => t.name);
        await notify(teamInMatch[j].creator, `Votre match pour le tournoi ${tournament_name} contre ${opponentString}`);
    }
}