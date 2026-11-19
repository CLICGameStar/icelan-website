export type BotError = (
  | { type: "invalid_data"; source: "database" | "user" }
  | { type: "other" }
) & { message?: string };
