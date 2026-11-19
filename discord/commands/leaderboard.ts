import { getParticipants } from "@/database/participants";
import { MessageFlags } from "discord.js";
import type { DiscordCommand } from "../discord";

const TOP_10: DiscordCommand = {
  name: "top_10",
  description: "Vois le top 10 des participants.",
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await interaction.editReply({
      content:
        "## Top 10\n" +
        (await getParticipants())
          .sort((a, b) => a.points - b.points)
          .slice(0, 10)
          .map((p, i) => `${i}. ${p.username} | <@${p.discord_id}>\n`)
          .join(""),
    });
  },
};

const CLASSEMENT: DiscordCommand = {
  name: "classement",
  description: "Vois ta position dans le classement.",
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const participants = await getParticipants();
    const pos = participants
      .sort((a, b) => a.points - b.points)
      .findIndex((p) => p.discord_id == interaction.user.id);
    await interaction.editReply({
      content:
        "## Ton classement\n" +
        participants
          .sort((a, b) => a.points - b.points)
          .slice(pos - 1, pos + 2)
          .map((p, i) => `${i + pos}. ${p.username} | <@${p.discord_id}>\n`)
          .join(""),
    });
  },
};

export const LEADERBOARD_COMMANDS = [TOP_10, CLASSEMENT];
