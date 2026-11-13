import type { TextChannel } from "discord.js";
import { client } from "./discord";

export const ERROR_CHANNEL_ID = "1570803461761667122";

export async function logErrorToDiscord(error: string) {
    const channel = (await client.channels.fetch(ERROR_CHANNEL_ID)) as TextChannel;
    await channel!.send(error);
}
