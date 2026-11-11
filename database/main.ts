import sqlite3, { type Database } from "better-sqlite3";
import { readFile } from "node:fs/promises";

async function read_migration(): Promise<string> {
    console.log("Migrating...");
    const res = readFile("database/migration.sql", "utf-8");
    console.log("Migration done!");
    return res;
}

export async function open_database(): Promise<Database> {
    const conn = new sqlite3("test.db", { fileMustExist: false });
    conn.exec(await read_migration());
    return conn;
}
