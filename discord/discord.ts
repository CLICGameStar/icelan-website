import { open_database } from "@/database/main";
import {
    Client,
    Events,
    GatewayIntentBits,
    REST,
    Routes,
    type CacheType,
    type ChatInputCommandInteraction,
} from "discord.js";
import { EVENT_COMMANDS } from "./commands/event";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

export interface DiscordCommand {
    name: string;
    description: string;
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
        async handler(interaction) {
            await interaction.reply("Pong!");
        },
    };

    const commands = [ping_command, ...EVENT_COMMANDS];
    const command_map: { [key: string]: DiscordCommand } = commands.reduce((acc, v) => ({ [v.name]: v, ...acc }), {});

    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_APP_TOKEN!);
    try {
        console.log("Started refreshing application (/) commands.");

        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
            body: commands.map(v => ({ name: v.name, description: v.description })),
        });

        console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }

    client.on(Events.InteractionCreate, async interaction => {
        if (!interaction.isChatInputCommand()) return;
        await command_map[interaction.commandName].handler(interaction);
    });

    // Log in to Discord with your client's token
    client.login(process.env.DISCORD_APP_TOKEN);
}
