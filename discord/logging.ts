import { getParticipant } from "@/database/participants";
import type { TextChannel } from "discord.js";
import { client } from "./discord";

export const LOG_CHANNEL_ID = "1570803461761667122";
export const USERS_CHANNEL_ID = "1569033463196291092";

export async function logToDiscord(error: string) {
  const channel = (await client.channels.fetch(LOG_CHANNEL_ID)) as TextChannel;
  await channel!.send(error);
}

export async function notify(participant_id: number, message: string) {
  const channel = (await client.channels.fetch(
    USERS_CHANNEL_ID,
  )) as TextChannel;
  await channel!.send(
    `<@${(await getParticipant(participant_id)).discord_id}>\n` + message,
  );
}
