export type BotError = (
  | { type: "invalid_data"; source: "database" | "user" }
  | { type: "other" }
  | { type: "missing_env"; env: string }
  | { type: "not_found" }
  | { type: "not_implemented" }
) & { message?: string };

export function throwError(error: BotError): never {
  throw error;
}
