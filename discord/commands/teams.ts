import {
  getParticipant,
  getParticipantFromDiscordId,
} from "@/database/participants";
import {
  getTeam,
  getTeamFromName,
  getTeamMembers,
  insertTeamInDatabase,
  type Team,
} from "@/database/teams";
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

function sendInvite(participant_id: number, team: Team) {
  throwError({
    type: "not_implemented",
    message: "sendInvite() not implemented",
  });
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
      creator = await getParticipantFromDiscordId(interaction.user.id);
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

const INVITER: DiscordCommand = {
  name: "inviter",
  description: "Invite un·e particpant·e à rejoindre une de tes équipes.",
  options: [
    {
      name: "equipe",
      description: "L'équipe dans laquelle tu souhaite l'inviter.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "participant",
      description: "La personne que tu souhaite inviter.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const participant_user = interaction.options.getUser("participant");
    const team_name = interaction.options.getString("equipe");
    const team = await getTeamFromName(team_name!);

    if (!team) {
      throwError({
        type: "not_found",
        message: "L'équipe n'a pas été trouvée.",
      });
    }

    const creator = await getParticipant(team.creator);
    if (creator.discord_id !== interaction.user.id) {
      throwError({
        type: "invalid_data",
        source: "user",
        message: "Tu n'es pas capitaine de cette équipe.",
      });
    }

    const participant = await getParticipantFromDiscordId(participant_user!.id);
    if (participant.id in (await getTeamMembers(team.id))) {
      throwError({
        type: "invalid_data",
        source: "user",
        message: `<@${participant.discord_id}> fait déjà partie de l'équipe.`,
      });
    }

    sendInvite(participant.id, team);
    await interaction.editReply(
      `<@${participant!.id}> a été invité à rejoindre l'équipe ${team.name}`,
    );
  },
};

export const TEAMS_COMMANDS = [CREATE_TEAM, INVITER];
