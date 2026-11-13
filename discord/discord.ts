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
import { EVENT_COMMANDS } from "./commands/event";
import { PARTICIPANTS_COMMANDS } from "./commands/participants";
import { logErrorToDiscord } from "./logging";

export const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

export interface DiscordCommand {
    name: string;
    description: string;
    defaultMemberPermissions?: bigint;
    options?: APIApplicationCommandOption[];
    handler: (interaction: ChatInputCommandInteraction<CacheType>) => Promise<void>;
}

export async function startDiscordBot() {
    // When the client is ready, run this code (only once).
    // The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
    // It makes some properties non-nullable.
    client.once(Events.ClientReady, readyClient => {
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
            await interaction.reply({ content: message ?? "", flags: MessageFlags.Ephemeral });
        },
    };

    const commands = [ping_command, ...EVENT_COMMANDS, ...PARTICIPANTS_COMMANDS];
    const command_map: { [key: string]: DiscordCommand } = commands.reduce((acc, v) => ({ [v.name]: v, ...acc }), {});

    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_APP_TOKEN!);
    try {
        console.log("Started refreshing application (/) commands.");

        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
            body: commands.map(v => ({
                name: v.name,
                description: v.description,
                default_member_permissions: v.defaultMemberPermissions?.toString() ?? null,
                options: v.options ?? [],
            })),
        });

        console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }

    client.on(Events.InteractionCreate, async interaction => {
        if (!interaction.isChatInputCommand()) return;
        try {
            await command_map[interaction.commandName].handler(interaction);
        } catch (error) {
            const content = `[ERROR]: Command failed.`;
            if (interaction.deferred || interaction.replied) {
                if (interaction.replied) {
                    await interaction.followUp({ content: content, flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.editReply({ content: content });
                }
            } else {
                await interaction.reply({ content: content, flags: MessageFlags.Ephemeral });
            }
            await logErrorToDiscord(
                `<@691967643728609290> <@459664790055550978> Vsy c'est la merde là. La commande \`/${interaction.commandName}\` a mega fail pour <@${interaction.user.id}>.\n\n[ERROR]: ${error as string}`,
            );
        }
    });

    // Log in to Discord with your client's token
    client.login(process.env.DISCORD_APP_TOKEN);
}
