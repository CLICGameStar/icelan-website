import { getTeams, getTeamsFromTournamentId } from "@/database/teams";
import {
  createTournament,
  deleteTournament,
  getTournament,
  getTournamentFromName,
  getTournamentParticipants,
  getTournaments,
  type Stage,
  type TournamentState,
} from "@/database/tournaments";
import {
  ApplicationCommandOptionType,
  MessageFlags,
  PermissionFlagsBits,
  type Guild,
  type Role,
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
    `- \`stage1\`: ${tournament.stage1.type}\n` +
    `- \`stage2\`: ${tournament.stage2?.type}\n` +
    `### Teams\n` +
    `Amount: \`${teams.length}\`\n` +
    teams.map((t) => `- **${t.name}**\n`).join("") +
    `### Participants\n` +
    `Amount: \`${participants.length}\`\n` +
    participants.map((p) => `- <@${p.discord_id}>`).join("")
  );
}

export async function getTournamentRole(
  id: number,
  guild: Guild,
): Promise<Role> {
  const tournament = await getTournament(id);
  let role = (await guild.roles.fetch()).find(
    (r) => r.name === tournament.name,
  );
  if (role) {
    return role;
  } else {
    return guild.roles.create({
      name: tournament.name,
    });
  }
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
  name: "create_tournament",
  description: "[ADMIN] Create a new tournament",
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
      name: "format",
      description: "The format of the tournament",
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
        {
          name: "Round Robin pool and single elim. bracket finale",
          value: "rr_pool_seb_finales",
        },
      ],
    },
  ],
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const tournament_name = interaction.options.getString("name");
    const team_size = interaction.options.getNumber("team_size");
    const format = interaction.options.getString("format");

    let stage1: Stage;
    let stage2: Stage | null = null;
    switch (format) {
      case "rr_pool_seb_finales":
        stage1 = {
          type: "round_robin",
          winnerCount: 0,
        };
        stage2 = { type: "single_elimination_bracket" };
        break;
      case "single_elimination_bracket":
        stage1 = { type: "single_elimination_bracket" };
        break;
      case "double_elimination_bracket":
        stage1 = { type: "double_elimination_bracket" };
        break;
      case "round_robin":
        stage1 = {
          type: "round_robin",
          winnerCount: 0,
        };
        break;
      default:
        throwError({
          type: "invalid_data",
          source: "user",
          message: "Invalid tournament format received: " + format,
        });
        break;
    }

    const tournament_id = await createTournament({
      name: tournament_name!,
      team_size: team_size!,
      stage1: stage1,
      stage2: stage2,
    });

    await interaction.editReply({
      content: await tournamentDataAsString(tournament_id),
    });
  },
};

const DELETE_TOURNAMENT: DiscordCommand = {
  name: "delete_tournament",
  description: "[ADMIN] Delete a tournament",
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [
    {
      name: "tournament",
      description: "Tournament you want to delete.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const tournament_name = interaction.options.getString("tournament");
    const tournament = await getTournamentFromName(tournament_name!);
    if (!tournament) {
      throwError({ type: "not_found", message: "DB Tournament not found" });
    }

    if (
      !(["created", "opened"] as TournamentState[]).includes(tournament.state)
    ) {
      throwError({
        type: "invalid_data",
        source: "user",
        message: `\`${tournament.name}\` has ${tournament.state} and can't be deleted.`,
      });
    }

    await deleteTournament(tournament.id);

    await interaction.editReply({ content: "Tournament deleted." });
  },
};

const TOURNAMENT_DATA: DiscordCommand = {
  name: "tournament_data",
  description: "[ADMIN] Show data about a tournament.",
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

const TOURNAMENT_INFO: DiscordCommand = {
  name: "tournament_info",
  description: "Voit toutes les infos en lien avec un tournoi.",
  options: [
    {
      name: "tournoi",
      description: "Le tournoi dont tu souhaite voir les infos.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const team_name = interaction.options.getString("tournoi");
    const tournament = await getTournamentFromName(team_name!);
    if (!tournament) {
      throwError({
        type: "invalid_data",
        source: "user",
        message: `Le tournoi \`${team_name}\` n'a pas été trouvé.`,
      });
    }
    const teams = await getTeamsFromTournamentId(tournament.id);
    const participants = await getTournamentParticipants(tournament.id);

    let statut;
    switch (tournament.state) {
      case "opened":
        statut = "Inscriptions ouvertes";
        break;
      case "started":
        statut = "En cours";
        break;
      case "finished":
        statut = "Terminé";
        break;
    }

    if (tournament.team_size === 1) {
      await interaction.editReply({
        content:
          `## Infos sur le tournoi \`${tournament?.name}\`\n` +
          `- \`nom\`: ${tournament.name}\n` +
          `- \`statut\`: ${statut}\n` +
          `### Participants\n` +
          `Nombre: \`${participants.length}\`\n` +
          participants.map((p) => `- <@${p.discord_id}>\n`).join(""),
      });
    } else {
      await interaction.editReply({
        content:
          `## Infos sur le tournoi \`${tournament?.name}\`\n` +
          `- \`nom\`: ${tournament.name}\n` +
          `- \`taille des équipes\`: ${tournament.team_size}\n` +
          `- \`statut\`: ${statut}\n` +
          `### Équipes\n` +
          `Nombre: \`${teams.length}\`\n` +
          teams.map((t) => `- **${t.name}**\n`).join("") +
          `### Participants\n` +
          `Nombre: \`${participants.length}\`\n` +
          participants.map((p) => `- <@${p.discord_id}>`).join(""),
      });
    }
  },
};

export const TOURNAMENT_COMMANDS = [
  LIST_TOURNAMENTS,
  CREATE_TOURNAMENT,
  TOURNAMENT_DATA,
  TOURNAMENT_INFO,
  DELETE_TOURNAMENT,
];
