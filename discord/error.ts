export type BotError = (
  | { type: "invalid_data"; source: "database" | "user" | "other" }
  | { type: "not_found" }
  | { type: "data_locked" }
  | { type: "not_implemented" }
  | { type: "other" }
  | { type: "missing_env"; env: string }
  | { type: "db_ranking_points_query_failed" }
  | { type: "invalid rank used (< 1)" }
  | { type: "failed point test" }
  | { type: "invalid number_of_team used (< 1)" }
  | { type: "invalid number of points set (< 2)" }
  | { type: "querry failed" }
) & { message?: string };

export function throwError(error: BotError): never {
  throw error;
}
