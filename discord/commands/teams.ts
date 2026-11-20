import {
  getParticipant,
  getParticipantByDiscordID,
} from "@/database/participants";
import { getTeam, insertTeamInDatabase } from "@/database/teams";
import { getTournament, getTournamentFromName } from "@/database/tournaments";
import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import type { DiscordCommand } from "../discord";
import { throwError, type BotError } from "../error";

async function teamDataAsString(id: number): Promise<string> {
  const team = await getTeam(id);
  return (
    `## Données sur ${team.name}` +
    `- \`tournoi\`: ${(await getTournament(team.tournament_id))?.name}\n` +
    `- \`nom\`: ${team.name}\n` +
    `- \`capitaine\`: <@${(await getParticipant(id)).discord_id}>\n` +
    `- \`équipiers\`: \n`
  );
}

const CREATE_TEAM: DiscordCommand = {
  name: "equipe_creation",
  description: "Crée une équipe pour un tournoi.",
  options: [
    {
      name: "tournoi",
      description: "Tournoi auquel l'équipe sera inscrite",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "nom_equipe",
      description: "Le nom de ton équipe",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const tournament_name = interaction.options.getString("tournoi");
    const team_name = interaction.options.getString("nom_equipe");
    let creator;
    try {
      creator = await getParticipantByDiscordID(interaction.user.id);
    } catch (error) {
      const bot_error = error as BotError;
      if (bot_error.type == "not_found") {
        await interaction.editReply(
          "Tu ne fait pas partie des participants d'ICeLAN",
        );
        return;
      } else {
        throw error;
      }
    }
    const tournament = await getTournamentFromName(tournament_name!);
    if (!tournament) {
      throwError({
        type: "not_found",
        message: "Le tournoi na pas été trouvé.",
      });
    }

    const team_id = await insertTeamInDatabase({
      name: team_name!,
      creator: creator.id,
      tournament_id: tournament!.id,
    });

    await interaction.editReply({ content: await teamDataAsString(team_id) });
  },
};

export const TEAMS_COMMANDS = [CREATE_TEAM];
