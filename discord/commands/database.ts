import { open_database } from "@/database/main";
import { PermissionFlagsBits } from "discord.js";
import type { DiscordCommand } from "../discord";

const DROP_PARTICIPANTS: DiscordCommand = {
    name: "drop_participants",
    description: "Drops the participants table in the database",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    async handler(interaction) {
        await interaction.deferReply();
        const conn = await open_database();
        conn.exec("DROP TABLE participants");
        await interaction.editReply("Table dropped");
    },
};

export const EVENT_COMMANDS = [DROP_PARTICIPANTS];
