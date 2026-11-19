import type { TextChannel } from "discord.js";
import { client } from "./discord";

export const LOG_CHANNEL_ID = "1570803461761667122";

export async function logToDiscord(error: string) {
  const channel = (await client.channels.fetch(LOG_CHANNEL_ID)) as TextChannel;
  await channel!.send(error);
}
