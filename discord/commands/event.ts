import { open_database } from "@/database/main";
import type { Participants as Participant } from "@/database/model";
import { directus } from "@/directus";
import type { IcelanParticipant } from "@/directus-config/types/aliases";
import { readItems } from "@directus/sdk";
import { MessageFlags, PermissionFlagsBits, type Guild } from "discord.js";
import type { DiscordCommand } from "../discord";

async function getGuildMemberId(guild: Guild, username: string): Promise<string | null> {
    const members = await guild.members.fetch({ query: username, limit: 10 });
    return members.find(m => m.user.username.toLowerCase() === username.toLowerCase())?.id ?? null;
}

const START_ICELAN_CMD: DiscordCommand = {
    name: "start_icelan",
    description: "Starts ICeLAN",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    async handler(interaction) {
        if (!interaction.guild) {
            await interaction.reply({ content: "Guild not found!", flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply();

        const directus_participants = (await directus().request(
            readItems("icelan_participants"),
        )) as IcelanParticipant[];

        const conn = await open_database();
        let st = conn.prepare(
            "INSERT INTO participants(email, first_name, family_name, username, discord_username, discord_id) VALUES(?, ?, ?, ?, ?, ?)",
        );

        for (const p of directus_participants) {
            const p_id = await getGuildMemberId(interaction.guild, p.discord_username!);
            if (p_id === null) {
                await interaction.followUp(`User @${p.discord_username} is not on the server!`);
                continue;
            }

            st.run(p.email, p.first_name, p.family_name, p.icelan_username, p.discord_username, p_id);
        }

        st = conn.prepare("SELECT * FROM participants");
        const participants = st.all() as Participant[];

        await interaction.editReply({
            content: participants
                .map(p => `- ${p.username} | ${p.first_name} ${p.family_name} (<@${p.discord_id}>)\n`)
                .join(""),
        });
    },
};

export const EVENT_COMMANDS = [START_ICELAN_CMD];
