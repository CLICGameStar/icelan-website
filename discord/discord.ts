import { open_database } from "@/database/main";
import {
  ApplicationCommandOptionType,
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  PermissionFlagsBits,
  REST,
  Routes,
  type APIApplicationCommandOption,
  type CacheType,
  type ChatInputCommandInteraction,
} from "discord.js";
import { LEADERBOARD_COMMANDS } from "./commands/leaderboard";
import { PARTICIPANTS_COMMANDS } from "./commands/participants";
import type { BotError } from "./error";
import { logToDiscord } from "./logging";

export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

export interface DiscordCommand {
  name: string;
  description: string;
  defaultMemberPermissions?: bigint;
  options?: APIApplicationCommandOption[];
  handler: (
    interaction: ChatInputCommandInteraction<CacheType>,
  ) => Promise<void>;
}

const discordGlobal = globalThis as typeof globalThis & {
  discordBotStarted?: boolean;
};

export async function startDiscordBot() {
  if (discordGlobal.discordBotStarted) return;
  discordGlobal.discordBotStarted = true;

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    open_database();
  });

  const ping_command: DiscordCommand = {
    name: "ping",
    description: "Replies with Pong!",
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
      {
        name: "message",
        description: "Text to echo back",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
    async handler(interaction) {
      const message = interaction.options.getString("message");
      await interaction.reply({
        content: message ?? "",
        flags: MessageFlags.Ephemeral,
      });
    },
  };

  const commands = [
    ping_command,
    ...PARTICIPANTS_COMMANDS,
    ...LEADERBOARD_COMMANDS,
  ];
  const command_map: { [key: string]: DiscordCommand } = commands.reduce(
    (acc, v) => ({ [v.name]: v, ...acc }),
    {},
  );

  const rest = new REST({ version: "10" }).setToken(
    process.env.DISCORD_APP_TOKEN!,
  );
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
      body: commands.map((v) => ({
        name: v.name,
        description: v.description,
        default_member_permissions:
          v.defaultMemberPermissions?.toString() ?? null,
        options: v.options ?? [],
      })),
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
      await command_map[interaction.commandName].handler(interaction);
    } catch (error: any) {
      console.log(error);

      await logToDiscord(
        `[\`/${interaction.commandName}\`][<@${interaction.user.id}>] [ERROR]: ${error}`.slice(
          0,
          2000,
        ),
      );
      const bot_error = error as BotError;
      let message;
      switch (bot_error.type) {
        case "directus_participant_not_found":
          message = `[ERROR]: Directus participant not found.`;
          break;
        case "invalid_data":
          message = `[ERROR]: Invalid data.`;
          break;
        case "guild_not_found":
          message = `[ERROR]: Guild not found.`;
          break;
        default:
          message = `[ERROR]: Command failed.`;
          break;
      }
      if (interaction.deferred || interaction.replied) {
        if (interaction.replied) {
          await interaction.followUp({
            content: message,
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.editReply({ content: message });
        }
      } else {
        await interaction.reply({
          content: message,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  });

  client.login(process.env.DISCORD_APP_TOKEN);
}
