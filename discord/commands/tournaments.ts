import { getTeams, getTeamsFromTournamentId } from "@/database/teams";
import {
  createTournament,
  getTournament,
  getTournamentFromName,
  getTournamentParticipants,
  getTournaments,
  StageType,
  type Stage,
} from "@/database/tournaments";
import {
  ApplicationCommandOptionType,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import type { DiscordCommand } from "../discord";
import { throwError } from "../error";

async function tournamentDataAsString(id: number): Promise<string> {
  const tournament = await getTournament(id);
  const teams = await getTeamsFromTournamentId(id);
  const participants = await getTournamentParticipants(id);
  return (
    `## Data about \`${tournament.name}\`\n` +
    `- \`id\`: ${tournament.id}\n` +
    `- \`name\`: ${tournament.name}\n` +
    `- \`team_size\`: ${tournament.team_size}\n` +
    `- \`state\`: ${tournament.state}\n` +
    `- \`stage1\`: ${tournament.stage1}\n` +
    `- \`stage2\`: ${tournament.stage2}\n` +
    `### Teams\n` +
    `Amount: \`${teams.length}\`\n` +
    teams.map((t) => `- **${t.name}**\n`).join("") +
    `### Participants\n` +
    `Amount: \`${participants.length}\`\n` +
    participants.map((p) => `- <@${p.discord_id}>`).join("")
  );
}

const LIST_TOURNAMENTS: DiscordCommand = {
  name: "list_tournaments",
  description: "Liste tous les tournois.",
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const tournaments = await getTournaments();
    const teams = await getTeams();
    await interaction.editReply({
      content:
        `## Tournois\nNombre : \`${tournaments.length}\`\n` +
        tournaments
          .map(
            (t) =>
              `- \`${t.name}\`, ${teams.filter((team) => team.tournament_id === t.id).length} ` +
              `${t.team_size > 1 ? "équipes inscrites" : "inscrits"}` +
              `${t.state === "opened" ? " | Inscriptions ouvertes" : ""}\n`,
          )
          .join(""),
    });
  },
};

const CREATE_TOURNAMENT: DiscordCommand = {
  name: "tournament_create",
  description: "Create a new tournament",
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [
    {
      name: "name",
      description: "The tournament's name",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "team_size",
      description: "The tournament's team sizes",
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
    {
      name: "first_stage_format",
      description:
        "The format of the first stage or the whole tournament if there is only one.",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: "Single Elimination Bracket",
          value: "single_elimination_bracket",
        },
        {
          name: "Double Elimination Bracket",
          value: "double_elimination_bracket",
        },
        {
          name: "Round Robin",
          value: "round_robin",
        },
      ],
    },
    {
      name: "rr_winner_count",
      description: "The number of teams going to the next stage.",
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
    {
      name: "second_stage_format",
      description: "The format of the second stage. Leave null if none.",
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        {
          name: "Single Elimination Bracket",
          value: "single_elimination_bracket",
        },
        {
          name: "Double Elimination Bracket",
          value: "double_elimination_bracket",
        },
      ],
    },
  ],
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const tournament_name = interaction.options.getString("name");
    const team_size = interaction.options.getNumber("team_size");
    const format1 = interaction.options.getString("first_stage_format");
    const rr_winner_count = interaction.options.getNumber("rr_winner_count");
    const format2 = interaction.options.getString("second_stage_format");

    const makeStage = (format: string): Stage => {
      if (format === "round_robin") {
        if (!rr_winner_count) {
          throwError({
            type: "invalid_data",
            source: "user",
            message: "missing winner count",
          });
        }

        return {
          type: format,
          winnerCount: rr_winner_count,
        };
      } else {
        return {
          type: format as
            | "single_elimination_bracket"
            | "double_elimination_bracket",
        };
      }
    };

    const tournament_id = await createTournament({
      name: tournament_name!,
      team_size: team_size!,
      stage1: makeStage(format1!),
      stage2: makeStage(format2!),
    });

    await interaction.editReply({
      content: await tournamentDataAsString(tournament_id),
    });
  },
};

const TOURNAMENT_DATA: DiscordCommand = {
  name: "tournament_data",
  description: "Show data about a tournament.",
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [
    {
      name: "tournament",
      description: "The tournament you want data about.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const tournament_name = interaction.options.getString("tournament");
    const tournament = await getTournamentFromName(tournament_name!);
    if (!tournament) {
      throwError({ type: "not_found", message: "DB Tournament not found." });
    }
    await interaction.editReply({
      content: await tournamentDataAsString(tournament.id),
    });
  },
};

export const TOURNAMENT_COMMANDS = [
  LIST_TOURNAMENTS,
  CREATE_TOURNAMENT,
  TOURNAMENT_DATA,
];
