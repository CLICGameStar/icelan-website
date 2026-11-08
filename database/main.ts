import sqlite3, { type Database } from "better-sqlite3";
import { readFile } from "node:fs/promises";

async function read_migration(): Promise<string> {
    console.log("Migrating...");
    return readFile("database/migration.sql", "utf-8");
}

export async function open_database(): Promise<Database> {
    let conn = new sqlite3("test.db", { fileMustExist: false });
    conn.exec(await read_migration());
    return conn;
}
