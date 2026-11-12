import { open_database } from "@/database/main";
import type { Participants as Participant } from "@/database/model";
import { directus } from "@/directus";
import type { IcelanParticipant } from "@/directus-config/types/aliases";
import { readItems } from "@directus/sdk";
import { ApplicationCommandOptionType, MessageFlags, PermissionFlagsBits, type Guild } from "discord.js";
import type { DiscordCommand } from "../discord";

async function getGuildMemberId(guild: Guild, username: string): Promise<string | null> {
    const members = await guild.members.fetch({ query: username, limit: 10 });
    return members.find(m => m.user.username.toLowerCase() === username.toLowerCase())?.id ?? null;
}

const LOAD_PARTICIPANTS: DiscordCommand = {
    name: "load_participants",
    description: "Fetch participants on Directus and load them into the database.",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    async handler(interaction) {
        if (!interaction.guild) {
            await interaction.reply({ content: "Guild not found!", flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const directus_participants = (await directus().request(
            readItems("icelan_participants"),
        )) as IcelanParticipant[];

        const conn = await open_database();
        let st = conn.prepare(
            "INSERT INTO participants(email, first_name, family_name, username, discord_username, discord_id) VALUES(?, ?, ?, ?, ?, ?)",
        );

        let missing_participants: IcelanParticipant[] = [];
        let errors: string[] = [];
        for (const p of directus_participants) {
            const p_id = await getGuildMemberId(interaction.guild, p.discord_username!);
            if (p_id === null) {
                missing_participants.push(p);
                continue;
            }

            try {
                st.run(p.email, p.first_name, p.family_name, p.icelan_username, p.discord_username, p_id);
            } catch (error) {
                errors.push(`[ERROR] Failed to load @${p.discord_username?.toLowerCase()}: ` + (error as string));
                continue;
            }
        }

        st = conn.prepare("SELECT * FROM participants");
        const participants = st.all() as Participant[];

        await interaction.editReply({
            content:
                "## Data in table\n" +
                participants
                    .map(p => `- ${p.username} | ${p.first_name} ${p.family_name} (<@${p.discord_id}>) | ${p.email}\n`)
                    .join("")
                    .concat(
                        missing_participants.length > 0
                            ? "\n## Fails\n" +
                                  missing_participants
                                      .map(p => `- @${p.discord_username?.toLowerCase()} is not on the server\n`)
                                      .join("")
                            : "",
                    )
                    .concat(errors.length > 0 ? "\n## Errors\n" + errors.join("\n") : ""),
        });
    },
};

const DROP_PARTICIPANTS: DiscordCommand = {
    name: "drop_participants",
    description: "Drops the participants table in the database.",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    async handler(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const conn = await open_database();
        conn.exec("DROP TABLE participants");
        await interaction.editReply("Table dropped");
    },
};

const LOAD_PARTICIPANT_MANUALLY: DiscordCommand = {
    name: "load_participant_manually",
    description: "Load a participant manually in the database from their ICeLAN username.",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "icelan_username",
            description: "ICeLAN username of the participant you want to load in the database.",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "discord_user",
            description: "The discord user that should be linked to this ICeLAN username.",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],
    async handler(interaction) {
        if (!interaction.guild) {
            await interaction.reply({ content: "Guild not found!", flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const icelan_username = interaction.options.getString("icelan_username");

        const participant = (await directus().request(
            readItems("icelan_participants", {
                filter: {
                    icelan_username: {
                        _eq: icelan_username,
                    },
                },
            }),
        )) as IcelanParticipant[];

        let p: IcelanParticipant;
        if (participant.length === 1) {
            p = participant[0];
        } else {
            await interaction.editReply(`[ERROR] Failed to find ${icelan_username} in the directus database.`);
            return;
        }

        const conn = await open_database();
        let st = conn.prepare(
            "INSERT INTO participants(email, first_name, family_name, username, discord_username, discord_id) VALUES(?, ?, ?, ?, ?, ?)",
        );

        const p_id = interaction.options.getUser("discord_user")?.id ?? null;

        try {
            st.run(p.email, p.first_name, p.family_name, p.icelan_username, p.discord_username, p_id);
        } catch (error) {
            await interaction.editReply(`[ERROR] Failed to load ${icelan_username}: ` + (error as string));
            return;
        }

        st = conn.prepare("SELECT * FROM participants WHERE username = ?");
        const participants = st.all(p.icelan_username) as Participant[];

        await interaction.editReply({
            content:
                `## Data about <@${participants.at(0)?.discord_id}> in table\n` +
                participants
                    .map(
                        p =>
                            `- \`username\`: ${p.username}\n- \`first_name\`: ${p.first_name}\n- \`family_name\`: ${p.family_name}\n- \`discord_id\`: <@${p.discord_id}>\n- \`email\`: ${p.email}`,
                    )
                    .join(""),
        });
    },
};

const LIST_PARTICIPANTS: DiscordCommand = {
    name: "list_participants",
    description: "Lists all participants in the database",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    async handler(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const conn = await open_database();
        const st = conn.prepare("SELECT * FROM participants");
        const participants = st.all() as Participant[];

        await interaction.editReply({
            content:
                "## Data in table\n" +
                participants
                    .map(p => `- ${p.username} | ${p.first_name} ${p.family_name} (<@${p.discord_id}>) | ${p.email}\n`)
                    .join(""),
        });
    },
};

export const PARTICIPANTS_COMMANDS = [
    LOAD_PARTICIPANTS,
    DROP_PARTICIPANTS,
    LOAD_PARTICIPANT_MANUALLY,
    LIST_PARTICIPANTS,
];
