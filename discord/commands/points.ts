import { ApplicationCommandOptionType, CacheType, ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from "discord.js";
import { DiscordCommand } from "../discord";
import { insertRankingPoints, RankingPoint } from "@/database/points";
import { throwError } from "../error";
import { describe } from "node:test";

const SET_RANKING_POINTS: DiscordCommand = {
    name: "set_ranking_points",
    description: "Set points awarded given rank and number of team",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "number_of_teams",
            description: "list of number of teams to set points for. Format: x1 x2 ... xN",
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: "points",
            description: "List of list of points. Format: x1 ... xN-y1 ... yN-...",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    async handler(interaction) {
        const notsString = interaction.options.getString("number_of_teams") ?? "";
        const pointsString = interaction.options.getString("points") ?? "";

        await interaction.deferReply({flags: MessageFlags.Ephemeral});

        const nots = notsString.split(" ").map(s => Number(s));
        const points = pointsString.split("-").map(ls => ls.split(" ").map(s => Number(s)));
        
        if (nots.length != points.length) throwError({
            type: "invalid_data",
            source: "user",
            message: "Number of points (" + nots.length + ") and number of team (" + points.length + ") not matching"
        });

        let rps: RankingPoint[] = [];
        for (let i = 0; i < nots.length; i++) {
            const not = nots[i];
            const ps = points [i];
            
            if (ps.length < 1) throwError({
                type: "invalid_data",
                source: "user",
                message: "Not enough points entered (" + ps.length + "), command canceled."}); 
            if (not < 2) throwError({
                type: "invalid_data",
                source: "user",
                message: "Number of team too small or invalid (" + not + "), command canceled."});
            if (ps.length > not) throwError({
                type: "invalid_data",
                source: "user",
                message: "Too many points entered (max. is: " + not + ", submitted: " + ps.length + "), command canceled."});
            
            rps.push({
                number_of_teams: not,
                points: ps,
            }); 
        }

        try { await insertRankingPoints(rps); }
        catch(error) { console.log("Failed to insert points with error: " + error); }

        await interaction.editReply({content: "Successfully inserted points in the database. Check with command /get_points_for_number_of_team."});
    }
}

const ADD_POINTS_GIVEN_NUMBER_OF_TEAM: DiscordCommand = {
    name: "add_points_given_number_of_team",
    description: "Store points awarded given ranking and number of team",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "number_of_team",
            description: "Number of team that could be participating to a tournament",
            type: ApplicationCommandOptionType.Integer,
            required: true,
        },
        {
            name: "points",
            description: "List of points. Format: x1 x2 ... xn, " +
                        "n is the rank and is less than the number of team.",
            type: ApplicationCommandOptionType.String,
            required: true
        },
    ],
    async handler(interaction) {
        const not = interaction.options.getInteger("number_of_team") ?? -1;
        const pointsString = interaction.options.getString("points") ?? "";

        await interaction.deferReply({flags: MessageFlags.Ephemeral});

        const points = pointsString.split(" ").map(s => Number(s))
        if (points.length < 1) throwError({
            type: "invalid_data",
            source: "user",
            message: "Not enough points entered (" + points.length + "), command canceled."}); 
        else if (not < 2) throwError({
            type: "invalid_data",
            source: "user",
            message: "Number of team too small or invalid (" + not + "), command canceled."});
        else if (points.length > not) throwError({
            type: "invalid_data",
            source: "user",
            message: "Too many points entered (max. is: " + not + ", submitted: " + points.length + "), command canceled."});
        else {
            try {
                await insertRankingPoints([{number_of_teams: not, points: points}]);
            } catch(error) {
                console.log("Failed to insert points with error: " + error);
            }
            await interaction.editReply({content: "Successfully inserted points in the database. Check with command /get_points_for_number_of_team."});
        }
    },
};
    
export const POINTS_COMMANDS = [
    ADD_POINTS_GIVEN_NUMBER_OF_TEAM,
    SET_RANKING_POINTS,
];