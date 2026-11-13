import {
    deleteParticipant,
    dropParticipantsTable,
    getParticipant,
    getParticipants,
    insertParticipantInDatabase,
    toggleStaffStatus,
} from "@/database/participants";
import { directus } from "@/directus";
import type { IcelanParticipant } from "@/directus-config/types/aliases";
import { readItems } from "@directus/sdk";
import { ApplicationCommandOptionType, MessageFlags, PermissionFlagsBits, type Guild } from "discord.js";
import type { DiscordCommand } from "../discord";

async function getGuildMemberId(guild: Guild, username: string): Promise<string | null> {
    const members = await guild.members.fetch({ query: username, limit: 10 });
    return members.find(m => m.user.username.toLowerCase() === username.toLowerCase())?.id ?? null;
}

async function participantDataAsString(discord_id: string): Promise<string> {
    const participant = await getParticipant(discord_id);
    if (!participant) {
        return `Participant <@${discord_id}> not found in the database.`;
    }
    return (
        `## Data about <@${participant.discord_id}> in table\n` +
        `- \`username\`: ${participant.username}\n` +
        `- \`first_name\`: ${participant.first_name}\n` +
        `- \`family_name\`: ${participant.family_name}\n` +
        `- \`discord_id\`: <@${participant.discord_id}>\n` +
        `- \`is_staff\`: ${participant.is_staff ? "Yes" : "No"}\n` +
        `- \`points\`: ${participant.points}\n`
    );
}

async function participantsDataAsString(): Promise<string> {
    const participants = await getParticipants();
    return (
        "## Data in table\n" +
        participants
            .map(
                p =>
                    `- ${p.is_staff ? "[STAFF]: " : ""}${p.username} | ${p.first_name} ${p.family_name} (<@${p.discord_id}>) | Score: ${p.points}\n`,
            )
            .join("")
    );
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

        let missing_participants: IcelanParticipant[] = [];
        let errors: string[] = [];
        for (const p of directus_participants) {
            const p_id = await getGuildMemberId(interaction.guild, p.discord_username!);
            if (p_id === null) {
                missing_participants.push(p);
                continue;
            }

            try {
                await insertParticipantInDatabase(
                    p.family_name!,
                    p.first_name!,
                    p.icelan_username!,
                    p.discord_username!,
                    p_id,
                    false,
                );
            } catch (error) {
                errors.push(`[ERROR] Failed to load @${p.discord_username?.toLowerCase()}: ` + (error as string));
                continue;
            }
        }

        await interaction.editReply({
            content: (await participantsDataAsString())
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
        await dropParticipantsTable();
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

        const p_id = interaction.options.getUser("discord_user")?.id ?? null;

        await insertParticipantInDatabase(
            p.family_name!,
            p.first_name!,
            p.icelan_username!,
            p.discord_username!,
            p_id!,
            false,
        );

        await interaction.editReply({
            content: await participantDataAsString(p_id!),
        });
    },
};

const LIST_PARTICIPANTS: DiscordCommand = {
    name: "list_participants",
    description: "Lists all participants in the database.",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    async handler(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        await interaction.editReply({
            content: await participantsDataAsString(),
        });
    },
};

const PARTICIPANT_DATA: DiscordCommand = {
    name: "participant_data",
    description: "Shows data about a participant in the database.",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "user",
            description: "Discord user of participant",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],
    async handler(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const user = interaction.options.getUser("user");

        await interaction.editReply({
            content: await participantDataAsString(user?.id!),
        });
    },
};

const DELETE_PARTICIPANT: DiscordCommand = {
    name: "delete_participant",
    description: "Deletes a participant from the database.",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "user",
            description: "Discord user of participant",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],
    async handler(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const user = interaction.options.getUser("user");

        await deleteParticipant(user?.id!);
        await interaction.editReply(`<@${user?.id}> deleted`);
    },
};

const CREATE_PARTICIPANT: DiscordCommand = {
    name: "create_participant",
    description: "Creates a participant and adds it to the table.",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "first_name",
            description: "Participant's first name",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "family_name",
            description: "Participant's family name",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "username",
            description: "Participant's ICeLAN username",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "discord_user",
            description: "The discord user that should be linked to this ICeLAN username.",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: "is_staff",
            description: "Is the participant a staff member?",
            type: ApplicationCommandOptionType.Boolean,
            required: false,
        },
    ],
    async handler(interaction) {
        const first_name = interaction.options.getString("first_name") ?? null;
        const family_name = interaction.options.getString("family_name") ?? null;
        const username = interaction.options.getString("username") ?? null;
        const discord_user = interaction.options.getUser("discord_user");
        const is_staff = interaction.options.getBoolean("is_staff") ?? false;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        await insertParticipantInDatabase(
            family_name!,
            first_name!,
            username!,
            discord_user?.username!,
            discord_user?.id!,
            is_staff,
        );

        await interaction.editReply({
            content: await participantDataAsString(discord_user?.id!),
        });
    },
};

const TOGGLE_STAFF: DiscordCommand = {
    name: "toggle_staff",
    description: "Toggles the staff status of a participant in the database.",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "user",
            description: "Discord user of participant",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],
    async handler(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const user = interaction.options.getUser("user");

        await toggleStaffStatus(user?.id!);
        const participant = await getParticipant(user?.id!);
        if (!participant) {
            await interaction.editReply(`<@${user?.id}> not found in the database.`);
            return;
        }
        await interaction.editReply(
            `<@${user?.id}> is now ${participant?.is_staff ? "a staff member" : "not a staff member"}`,
        );
    },
};

export const PARTICIPANTS_COMMANDS = [
    LOAD_PARTICIPANTS,
    LOAD_PARTICIPANT_MANUALLY,
    DROP_PARTICIPANTS,
    LIST_PARTICIPANTS,
    PARTICIPANT_DATA,
    DELETE_PARTICIPANT,
    CREATE_PARTICIPANT,
    TOGGLE_STAFF,
];
