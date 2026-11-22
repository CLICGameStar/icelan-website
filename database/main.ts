import { throwError } from "@/discord/error";
import sqlite3, { type Database } from "better-sqlite3";
import { readFile } from "node:fs/promises";

async function readMigration(): Promise<string> {
  console.log("Migrating...");
  const res = readFile("database/migration.sql", "utf-8");
  console.log("Migration done!");
  return res;
}

var conn: Database | null = null;

export async function openDatabase(): Promise<Database> {
  if (conn === null) {
    conn = new sqlite3(
      process.env.DATABASE_FILE ||
        throwError({ type: "missing_env", env: "DATABASE_FILE" }),
      { fileMustExist: false },
    );
    conn.exec(await readMigration());
  }

  return conn;
}
