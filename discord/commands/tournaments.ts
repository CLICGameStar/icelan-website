import { getTeams } from "@/database/teams";
import { getTournaments } from "@/database/tournaments";
import { MessageFlags } from "discord.js";
import type { DiscordCommand } from "../discord";

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
              `${t.state === "opened" ? " | Inscriptions ouvertes" : null}\n`,
          )
          .join(""),
    });
  },
};

export const TOURNAMENT_COMMANDS = [LIST_TOURNAMENTS];
