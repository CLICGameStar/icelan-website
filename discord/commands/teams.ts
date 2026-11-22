import {
  getParticipant,
  getParticipantFromDiscordId,
  type Participant,
} from "@/database/participants";
import {
  deleteEnrollment,
  deleteEnrollmentsFromTeamId,
  deleteTeam,
  getTeam,
  getTeamFromName,
  getTeamMembers,
  getTeams,
  insertEnrollment,
  insertTeam,
  type Team,
} from "@/database/teams";
import {
  getTournament,
  getTournamentFromName,
  getTournamentParticipants,
} from "@/database/tournaments";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  PermissionFlagsBits,
  type TextChannel,
} from "discord.js";
import {
  client,
  type ComponentInteraction,
  type DiscordCommand,
} from "../discord";
import { throwError } from "../error";
import { notify, USERS_CHANNEL_ID } from "../logging";

async function teamDataAsString(id: number): Promise<string> {
  const team = await getTeam(id);
  return (
    `## Données sur ${team.name}\n` +
    `- \`tournoi\`: ${(await getTournament(team.tournament_id))?.name}\n` +
    `- \`nom\`: ${team.name}\n` +
    `- \`capitaine\`: <@${(await getParticipant(team.creator)).discord_id}>\n` +
    `- \`équipiers\`: ${(await getTeamMembers(team.id)).map((m) => `<@${m.discord_id}>`).join(", ")}\n`
  );
}

async function sendTeamInvite(participant: Participant, team: Team) {
  const accept = new ButtonBuilder()
    .setCustomId(`team_invite:${participant.id}:${team.id}:accept`)
    .setLabel("Accepter")
    .setStyle(ButtonStyle.Success);

  const refuse = new ButtonBuilder()
    .setCustomId(`team_invite:${participant.id}:${team.id}:refuse`)
    .setLabel("Refuser")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    accept,
    refuse,
  );

  const channel = (await client.channels.fetch(
    USERS_CHANNEL_ID,
  )) as TextChannel;

  await channel.send({
    content: `<@${participant.discord_id}>\nTu as été invité·e à rejoindre l'équipe **${team.name}** par <@${(await getParticipant(team.creator)).discord_id}>.\n\nAcceptes-tu l'invitation ?`,
    components: [row],
  });
}

async function _deleteTeam(id: number) {
  const team = await getTeam(id);
  (await getTeamMembers(id)).forEach((m) =>
    notify(m.id, `L'équipe **${team.name}** a été supprimée.`),
  );
  await deleteEnrollmentsFromTeamId(team.id);
  await deleteTeam(team.id);
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
    const creator = await getParticipantFromDiscordId(interaction.user.id);

    const tournament = await getTournamentFromName(tournament_name!);
    if (!tournament) {
      throwError({
        type: "not_found",
        message: "Le tournoi na pas été trouvé.",
      });
    }

    // Check que le créateur ne fait pas déjà partie du tournoi
    if (
      (await getTournamentParticipants(tournament.id))
        .map((p) => p.id)
        .includes(creator.id)
    ) {
      throwError({
        type: "invalid_data",
        source: "user",
        message: "Tu es déjà inscrit·e à ce tournoi.",
      });
    }

    const team_id = await insertTeam({
      name: team_name!,
      creator: creator.id,
      tournament_id: tournament!.id,
    });
    await insertEnrollment({ participant_id: creator.id, team_id: team_id });

    await interaction.editReply({ content: await teamDataAsString(team_id) });
  },
};

const DELETE_TEAM: DiscordCommand = {
  name: "equipe_supprimer",
  description: "Supprime une de tes équipes et désincrit la du tournoi",
  options: [
    {
      name: "equipe",
      description: "L'équipe que tu souhaite supprimer.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const team_name = interaction.options.getString("equipe");
    const team = await getTeamFromName(team_name!);

    if (!team) {
      throwError({
        type: "not_found",
        message: "L'équipe n'a pas été trouvée.",
      });
    }

    if (
      team.creator !==
      (await getParticipantFromDiscordId(interaction.user.id)).id
    ) {
      throwError({
        type: "invalid_data",
        source: "user",
        message: "Tu n'es pas capitaine de cette équipe.",
      });
    }

    const confirm = new ButtonBuilder()
      .setCustomId(`team_delete:${team.id}:confirm`)
      .setLabel("Confirmer")
      .setStyle(ButtonStyle.Danger);

    const cancel = new ButtonBuilder()
      .setCustomId(`team_delete:${team.id}:cancel`)
      .setLabel("Annuler")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      confirm,
      cancel,
    );

    await interaction.editReply({
      content: `Souhaites-tu vraiment supprimer l'équipe **${team.name}** inscrite au tournoi ${(await getTournament(team.tournament_id))?.name}?\nCela va te désincrire du tournoi ainsi que toute ton équipe.`,
      components: [row],
    });
  },
};

const LIST_TEAMS: DiscordCommand = {
  name: "list_teams",
  description: "Lists all of the teams",
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const teams = await getTeams();
    await interaction.editReply({
      content:
        "## Teams\n" +
        teams
          .map(
            async (t) =>
              `- \`${t.name}\` in \`${(await getTournament(t.tournament_id))?.name}\`\n`,
          )
          .join(""),
    });
  },
};

const TEAM_DATA: DiscordCommand = {
  name: "equipe_infos",
  description: "Vois les infos sur une équipe.",
  options: [
    {
      name: "equipe",
      description: "L'équipe dont tu veux voir les infos",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const team_name = interaction.options.getString("equipe");
    const team = await getTeamFromName(team_name!);
    if (!team) {
      throwError({
        type: "not_found",
        message: "L'équipe n'a pas été trouvée.",
      });
    }
    await interaction.editReply(await teamDataAsString(team.id));
  },
};

const INVITE: DiscordCommand = {
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

    if (
      team.creator !==
      (await getParticipantFromDiscordId(interaction.user.id)).id
    ) {
      throwError({
        type: "invalid_data",
        source: "user",
        message: "Tu n'es pas capitaine de cette équipe.",
      });
    }

    const participant = await getParticipantFromDiscordId(participant_user!.id);
    if (
      (await getTeamMembers(team.id)).map((p) => p.id).includes(participant.id)
    ) {
      throwError({
        type: "invalid_data",
        source: "user",
        message: `<@${participant.discord_id}> fait déjà partie de l'équipe.`,
      });
    }

    if (team.confirmed) {
      throwError({
        type: "data_locked",
        message: "Cette équipe ne peut plus être modifiée.",
      });
    }

    if (
      (await getTournamentParticipants(team.tournament_id))
        .map((p) => p.id)
        .includes(participant.id)
    ) {
      throwError({
        type: "invalid_data",
        source: "user",
        message: `<@${participant.discord_id}> est déjà inscrit·e au tournoi.`,
      });
    }

    sendTeamInvite(participant, team);
    await interaction.editReply(
      `<@${participant.discord_id}> a été invité à rejoindre l'équipe **${team.name}**.`,
    );
  },
};

const KICK: DiscordCommand = {
  name: "kicker",
  description: "Kick un·e participant·e de ton équipe",
  options: [
    {
      name: "equipe",
      description: "L'équipe dont tu veut kicker la personne.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "participant",
      description: "La personne que tu veut kicker.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const team_name = interaction.options.getString("equipe");
    const participant_user = interaction.options.getUser("participant");
    const team = await getTeamFromName(team_name!);

    if (!team) {
      throwError({
        type: "not_found",
        message: "L'équipe n'a pas été trouvée",
      });
    }

    if (
      team.creator !==
      (await getParticipantFromDiscordId(interaction.user.id)).id
    ) {
      throwError({
        type: "invalid_data",
        source: "user",
        message: "Tu n'es pas capitaine de l'équipe.",
      });
    }

    const participant = await getParticipantFromDiscordId(participant_user!.id);
    if (team.creator === participant.id) {
      throwError({
        type: "invalid_data",
        source: "user",
        message: "Tu ne peut pas te kicker toi même de ton équipe.",
      });
    }

    if (team.confirmed) {
      throwError({
        type: "data_locked",
        message: "Cette équipe ne peut plus être modifiée.",
      });
    }

    await deleteEnrollment(participant.id, team.id);

    // Check que la personne ne fait plus partie de l'équipe.
    if (
      (await getTeamMembers(team.id)).map((m) => m.id).includes(participant.id)
    ) {
      throwError({ type: "querry failed", message: "La fonction a échoué." });
    }

    await interaction.editReply({
      content: `<@${participant.discord_id}> a été kické de l'équipe **${team.name}**.`,
    });
    await notify(
      participant.id,
      `Tu as été kické de l'équipe **${team.name}**.`,
    );
  },
};

const TEAM_INVITE: ComponentInteraction = {
  name: "team_invite",
  async handler(interaction, args) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const participant = await getParticipant(parseInt(args[0]));

    if (interaction.user.id !== participant.discord_id) {
      throwError({
        type: "invalid_data",
        source: "user",
        message: "Ce message n'est pas destiné à toi.",
      });
    }

    const team = await getTeam(parseInt(args[1]));
    if (team.confirmed) {
      await interaction.message.delete();
      throwError({
        type: "data_locked",
        message: "Cette équipe ne peut plus être modifiée.",
      });
    }

    const accepted =
      args[2] === "accept"
        ? true
        : args[2] === "refuse"
          ? false
          : throwError({
              type: "invalid_data",
              source: "other",
              message: "customId error",
            });

    if (
      (await getTournamentParticipants(team.tournament_id))
        .map((p) => p.id)
        .includes(participant.id)
    ) {
      await interaction.message.delete();
      throwError({
        type: "invalid_data",
        source: "user",
        message: "Tu es déjà inscrit·e à ce tournoi.",
      });
    }

    if (accepted) {
      insertEnrollment({ participant_id: participant.id, team_id: team.id });
      await interaction.editReply({
        content: `Tu as rejoint l'équipe **${team.name}**.`,
      });
      await notify(
        team.creator,
        `<@${participant.discord_id}> a rejoint **${team.name}**.`,
      );
    } else {
      await interaction.editReply({
        content: `Tu as refusé l'invitation.`,
      });
      await notify(
        team.creator,
        `<@${participant.discord_id}> a refusé l'invitation.`,
      );
    }
    await interaction.message.delete();
  },
};

const TEAM_DELETE: ComponentInteraction = {
  name: "team_delete",
  async handler(interaction, args) {
    const team = await getTeam(parseInt(args[0]));
    const creator = await getParticipant(team.creator);

    if (interaction.user.id !== creator.discord_id) {
      throwError({
        type: "invalid_data",
        source: "user",
        message: "Ce message n'est pas destiné à toi.",
      });
    }

    if (team.confirmed) {
      await interaction.update({
        content: `Cette équipe ne peut plus être modifiée.`,
        components: [],
      });
      throwError({
        type: "data_locked",
        message: "Cette équipe ne peut plus être modifiée.",
      });
    }

    const supprimer =
      args[1] === "confirm"
        ? true
        : args[1] === "cancel"
          ? false
          : throwError({
              type: "invalid_data",
              source: "other",
              message: "invalid customId",
            });

    if (supprimer) {
      await _deleteTeam(team.id);
      await interaction.update({
        content: `L'équipe **${team.name}** a été supprimée`,
        components: [],
      });
    } else {
      await interaction.update({
        content: `Opération annulée`,
        components: [],
      });
    }
  },
};

export const TEAMS_COMMANDS = [
  CREATE_TEAM,
  DELETE_TEAM,
  LIST_TEAMS,
  TEAM_DATA,
  INVITE,
  KICK,
];
export const TEAM_BUTTON_INTERACTIONS = [TEAM_INVITE, TEAM_DELETE];
