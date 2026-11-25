import { getParticipantFromDiscordId } from "@/database/participants";
import { register, unregister } from "@/database/registrations";
import {
  getTournamentFromName,
  getTournamentParticipants,
} from "@/database/tournaments";
import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import type { DiscordCommand } from "../discord";
import { throwError } from "../error";

const REGISTER: DiscordCommand = {
  name: "register",
  description: "Inscrit toi à un tournoi",
  options: [
    {
      name: "tournoi",
      description: "Le tournoi auquel tu souhaite t'inscrire.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const tournament = await getTournamentFromName(
      interaction.options.getString("tournoi")!,
    );

    if (!tournament) {
      throwError({
        type: "invalid_data",
        source: "user",
        message: "Le tournoi n'a pas été trouvé.",
      });
    }

    if (tournament.state !== "opened") {
      throwError({
        type: "invalid_data",
        source: "user",
        message: `Les inscriptions au tournoi \`${tournament.name}\` ne sont pas ouvertes.`,
      });
    }

    if (
      (await getTournamentParticipants(tournament.id))
        .map((p) => p.discord_id)
        .includes(interaction.user.id)
    ) {
      throwError({
        type: "invalid_data",
        source: "user",
        message: "Tu est déjà inscrit·e à ce tournoi.",
      });
    }

    const participant = await getParticipantFromDiscordId(interaction.user.id);

    await register(participant.id, tournament.id);

    // Check
    if (
      !(await getTournamentParticipants(tournament.id))
        .map((p) => p.id)
        .includes(participant.id)
    ) {
      throwError({ type: "querry failed", message: "L'opération a échoué." });
    }
    await interaction.editReply({
      content: `Tu es maintenant inscrit·e au tournoi \`${tournament.name}\``,
    });
  },
};

const UNREGISTER: DiscordCommand = {
  name: "unregister",
  description: "Désincrit-toi d'un tournoi.",
  options: [
    {
      name: "tournoi",
      description: "Le tournoi dont tu souhaite te désinscrire",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const tournament = await getTournamentFromName(
      interaction.options.getString("tournoi")!,
    );
    const participant = await getParticipantFromDiscordId(interaction.user.id);

    if (!tournament) {
      throwError({
        type: "invalid_data",
        source: "user",
        message: "Le tournoi n'a pas été trouvé.",
      });
    }

    if (tournament.state !== "opened") {
      throwError({
        type: "invalid_data",
        source: "user",
        message: `Tu ne peut plus te désinscrire de ce tournoi.`,
      });
    }

    if (
      !(await getTournamentParticipants(tournament.id))
        .map((p) => p.id)
        .includes(participant.id)
    ) {
      throwError({
        type: "invalid_data",
        source: "user",
        message: "Tu n'est pas inscrit·e à ce tournoi.",
      });
    }

    await unregister(participant.id, tournament.id);

    if (
      (await getTournamentParticipants(tournament.id))
        .map((p) => p.id)
        .includes(participant.id)
    ) {
      throwError({ type: "querry failed", message: "L'opération a échoué" });
    }

    await interaction.editReply({ content: "Tu a été désinscrit du tournoi." });
  },
};

export const REGISTRATIONS_COMMANDS = [REGISTER, UNREGISTER];
