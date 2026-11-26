import { getParticipantFromDiscordId } from "@/database/participants";
import { getTeamsFromParticpantId } from "@/database/teams";
import {
  getTournaments,
  getTournamentsFromParticipantId,
} from "@/database/tournaments";
import { MessageFlags } from "discord.js";
import type { DiscordCommand } from "../discord";
import { getRank } from "./leaderboard";

const USER_INFO: DiscordCommand = {
  name: "user_info",
  description: "Voit toutes les infos te concernant.",
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const p = await getParticipantFromDiscordId(interaction.user.id);
    const teams = await getTeamsFromParticpantId(p.id);
    const tournaments = await getTournaments();
    const tr = await getTournamentsFromParticipantId(p.id);
    await interaction.editReply({
      content:
        "## Tes infos\n" +
        `- Pseudo ICeLAN : ${p.username}\n` +
        `- Ton classement : \`${p.is_staff ? "staff" : await getRank(p.id)}\`\n` +
        `### Tes équipes\n` +
        teams
          .map(
            (t) =>
              `- ${t.creator === p.id ? "Capitaine de " : "Équipier·e de "}**${t.name}** pour le tournoi \`${tournaments.find((tour) => tour.id === t.tournament_id)!.name}\`\n`,
          )
          .join("") +
        `### Tournois auquels tu es inscrit·e\n` +
        tr.map((t) => `- \`${t.name}\`\n`).join(""),
    });
  },
};

export const USER_UTIL_COMMANDS = [USER_INFO];
