export type BotError = (
  | { type: "invalid_data"; source: "database" | "user" }
  | { type: "other" }
  | { type: "guild_not_found" }
  | { type: "directus_participant_not_found" }
  | { type: "db_participant_not_found" }
) & { message?: string };

export function throwError(error: BotError): never {
  throw error;
}
