// Require the necessary discord.js classes
import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

export function register() {
    (async () => {
        // When the client is ready, run this code (only once).
        // The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
        // It makes some properties non-nullable.
        client.once(Events.ClientReady, readyClient => {
            console.log(`Ready! Logged in as ${readyClient.user.tag}`);
        });

        const commands = [
            {
                name: "ping",
                description: "Replies with Pong!",
            },
        ];

        const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_APP_TOKEN!);
        try {
            console.log("Started refreshing application (/) commands.");

            await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), { body: commands });

            console.log("Successfully reloaded application (/) commands.");
        } catch (error) {
            console.error(error);
        }

        client.on(Events.InteractionCreate, async interaction => {
            if (!interaction.isChatInputCommand()) return;

            switch (interaction.commandName) {
                case "ping": {
                    await interaction.reply("Pong!");
                    break;
                }
            }
        });

        // Log in to Discord with your client's token
        client.login(process.env.DISCORD_APP_TOKEN);
    })();
}
