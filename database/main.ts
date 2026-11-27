import { throwError } from "@/discord/error";
import sqlite3, { type Database } from "better-sqlite3";
import { readFile } from "node:fs/promises";

async function readMigration(): Promise<string> {
  return await readFile("database/migration.sql", "utf-8");
}
async function readSeed(): Promise<string> {
  return await readFile("database/seed.sql", "utf-8");
}

var conn: Database | null = null;

export async function openDatabase(): Promise<Database> {
  if (conn === null) {
    conn = new sqlite3(
      process.env.DATABASE_FILE ||
        throwError({ type: "missing_env", env: "DATABASE_FILE" }),
      { fileMustExist: false },
    );

    console.log("Migrating...");
    conn.exec(await readMigration());
    console.log("Migration done!");

    if (process.env["NODE_ENV"] === "development") {
      console.log("Seeding...");
      conn.exec(await readSeed());
      console.log("Seeding done!");
    }

    conn.pragma("foreign_keys = ON");
    const violations = conn.pragma("foreign_key_check");
    console.log("[DATABASE]: Violations\n" + JSON.stringify(violations));
  }

  return conn;
}

export async function rawSqlQuery(query: string): Promise<unknown> {
  const conn = await openDatabase();
  if (query.startsWith("SELECT")) {
    return conn.prepare(query).all();
  } else {
    return conn.prepare(query).run();
  }
}
