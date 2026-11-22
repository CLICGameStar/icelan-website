import { ApplicationCommandOptionType, CacheType, ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from "discord.js";
import { DiscordCommand } from "../discord";
import { insertRankingPoints } from "@/database/points";
import { throwError } from "../error";

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
];