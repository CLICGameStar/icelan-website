export type BotError = (
  | { type: "invalid_data"; source: "database" | "user" }
  | { type: "other" }
  | { type: "guild_not_found" }
  | { type: "directus_participant_not_found" }
  | { type: "db_participant_not_found" }
  | { type: "missing_env", env: string }
  | { type: "db_ranking_points_query_failed"}
  | { type: "invalid rank used (< 1)" }
  | { type: "failed point test" }
  | { type: "invalid number_of_team used (< 1)" }
  | { type: "invalid number of points set (< 2)" }
) & { message?: string };

export function throwError(error: BotError): never {
  throw error;
}
