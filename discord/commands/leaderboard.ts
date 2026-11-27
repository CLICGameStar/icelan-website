import {
  getParticipantFromDiscordId,
  getParticipants,
} from "@/database/participants";
import { MessageFlags } from "discord.js";
import type { DiscordCommand } from "../discord";

export async function getRank(id: number): Promise<number> {
  return (await getParticipants())
    .filter((p) => !p.is_staff)
    .sort((a, b) => a.points - b.points)
    .findIndex((p) => p.id == id);
}

const TOP_20: DiscordCommand = {
  name: "top_20",
  description: "Vois le top 20 des participants.",
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await interaction.editReply({
      content:
        "## Top 20\n" +
        (await getParticipants())
          .filter((p) => !p.is_staff)
          .sort((a, b) => a.points - b.points)
          .slice(0, 20)
          .map((p, i) => `${i}. ${p.username} | <@${p.discord_id}>\n`)
          .join(""),
    });
  },
};

const RANK: DiscordCommand = {
  name: "rank",
  description: "Vois ta position dans le classement.",
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const u = await getParticipantFromDiscordId(interaction.user.id);
    const participants = await getParticipants();
    const pos = await getRank(u.id);
    if (u.is_staff) {
      await interaction.editReply({
        content: "Tu n'as pas de classement en tant que staff :(",
      });
      return;
    }
    await interaction.editReply({
      content:
        "## Ton classement\n" +
        participants
          .filter((p) => !p.is_staff)
          .sort((a, b) => a.points - b.points)
          .slice(pos - 1, pos + 2)
          .map((p, i) => `${i + pos}. ${p.username} | <@${p.discord_id}>\n`)
          .join(""),
    });
  },
};

export const LEADERBOARD_COMMANDS = [TOP_20, RANK];
