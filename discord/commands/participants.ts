import {
  deleteParticipant,
  dropParticipantsTable,
  getParticipantByDiscordID,
  getParticipants,
  insertParticipantInDatabase,
  insertParticipantsInDatabase,
  toggleDonatorStatus,
  toggleStaffStatus,
  type Participant,
} from "@/database/participants";
import { directus } from "@/directus";
import type { IcelanParticipant } from "@/directus-config/types/aliases";
import { readItems } from "@directus/sdk";
import {
  ApplicationCommandOptionType,
  MessageFlags,
  PermissionFlagsBits,
  type Guild,
} from "discord.js";
import type { DiscordCommand } from "../discord";
import { throwError } from "../error";

async function getGuildMemberId(
  guild: Guild,
  username: string,
): Promise<string | null> {
  const members = await guild.members.fetch({ query: username, limit: 10 });
  return (
    members.find(
      (m) => m.user.username.toLowerCase() === username.toLowerCase(),
    )?.id ?? null
  );
}

async function participantDataAsString(discord_id: string): Promise<string> {
  const participant = await getParticipantByDiscordID(discord_id);
  return (
    `## Data about <@${participant.discord_id}> in table\n` +
    `- \`id\`: ${participant.id}\n` +
    `- \`username\`: ${participant.username}\n` +
    `- \`first_name\`: ${participant.first_name}\n` +
    `- \`family_name\`: ${participant.family_name}\n` +
    `- \`discord_id\`: <@${participant.discord_id}>\n` +
    `- \`is_staff\`: ${participant.is_staff ? "Yes" : "No"}\n` +
    `- \`is_donator\`: ${participant.is_donator ? "Yes" : "No"}\n` +
    `- \`points\`: ${participant.points}\n`
  );
}

async function participantsDataAsString(): Promise<string> {
  const participants = await getParticipants();
  return (
    `## Participants\nNombre : \`${participants.length}\`` +
    participants
      .map((p) => `- ${p.is_staff ? "[STAFF]: " : ""}${p.username}\n`)
      .join("")
  );
}

const LOAD_PARTICIPANTS: DiscordCommand = {
  name: "load_participants",
  description:
    "Fetch participants on Directus and load them into the database.",
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  async handler(interaction) {
    if (!interaction.guild) {
      throwError({ type: "not_found", message: "Not in a server" });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let directus_participants: IcelanParticipant[];

    directus_participants = (await directus().request(
      readItems("icelan_participants"),
    )) as IcelanParticipant[];

    let participants: Participant[] = [];
    let missing_participants: IcelanParticipant[] = [];
    let errors: string[] = [];
    for (const p of directus_participants) {
      const p_id = await getGuildMemberId(
        interaction.guild,
        p.discord_username!.trim(),
      );
      if (p_id === null) {
        missing_participants.push(p);
        continue;
      }

      try {
        participants.push({
          id: 0,
          family_name: p.family_name!,
          first_name: p.first_name!,
          username: p.icelan_username!,
          discord_username: p.discord_username!,
          discord_id: p_id,
          is_staff: false,
          is_donator: false,
          points: 0,
        });
      } catch (error) {
        errors.push(
          `[ERROR] Failed to load @${p.discord_username?.toLowerCase()}: ` +
            (error as string),
        );
        continue;
      }
    }

    await insertParticipantsInDatabase(participants);

    await interaction.editReply({
      content: (await participantsDataAsString())
        .concat(
          missing_participants.length > 0
            ? "\n## Fails\n" +
                missing_participants
                  .map(
                    (p) =>
                      `- @${p.discord_username?.toLowerCase()} is not on the server\n`,
                  )
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
  description:
    "Load a participant manually in the database from their ICeLAN username.",
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [
    {
      name: "icelan_username",
      description:
        "ICeLAN username of the participant you want to load in the database.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "discord_user",
      description:
        "The discord user that should be linked to this ICeLAN username.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
  async handler(interaction) {
    if (!interaction.guild) {
      throwError({ type: "not_found", message: "Not in a server" });
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
      throwError({
        type: "not_found",
        message: "Directus participant not found.",
      });
    }

    const p_id = interaction.options.getUser("discord_user")!.id;

    await insertParticipantInDatabase({
      family_name: p.family_name!,
      first_name: p.first_name!,
      username: p.icelan_username!,
      discord_username: p.discord_username!,
      discord_id: p_id,
      is_staff: false,
      is_donator: false,
    });

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
      description:
        "The discord user that should be linked to this ICeLAN username.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "is_staff",
      description: "Is the participant a staff member?",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
    {
      name: "is_donator",
      description: "Is the participant a donator?",
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
    const is_donator = interaction.options.getBoolean("is_donator") ?? false;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    await insertParticipantInDatabase({
      family_name: family_name!,
      first_name: first_name!,
      username: username!,
      discord_username: discord_user?.username!,
      discord_id: discord_user?.id!,
      is_staff: is_staff,
      is_donator: is_donator,
    });

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
    const participant = await getParticipantByDiscordID(user?.id!);
    await interaction.editReply(
      `<@${user?.id}> is now ${participant?.is_staff ? "a staff member" : "not a staff member"}`,
    );
  },
};

const TOGGLE_DONATOR: DiscordCommand = {
  name: "toggle_donator",
  description: "Toggles the donator status of a participant in the database.",
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

    await toggleDonatorStatus(user?.id!);
    const participant = await getParticipantByDiscordID(user?.id!);
    await interaction.editReply(
      `<@${user?.id}> is now ${participant?.is_donator ? "a donator" : "not a donator"}`,
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
  TOGGLE_DONATOR,
];
