import { throwError } from "@/discord/error";
import { open_database } from "./main";
import type { DBParticipant } from "./model";

export type NewParticipant = {
  first_name: string;
  family_name: string;
  username: string;
  discord_username: string;
  discord_id: string;
  is_staff: boolean;
  is_donator: boolean;
};

export type Participant = NewParticipant & { id: number; points: number };

export async function insertParticipantInDatabase(p: NewParticipant) {
  const conn = await open_database();
  const st = conn.prepare(
    "INSERT INTO participants(first_name, family_name, username, discord_username, discord_id, is_staff, is_donator, points) VALUES(?, ?, ?, ?, ?, ?, ?, ?)",
  );
  st.run(
    p.first_name,
    p.family_name,
    p.username,
    p.discord_username,
    p.discord_id,
    p.is_staff ? 1 : 0,
    p.is_donator ? 1 : 0,
    0,
  );
}

export async function insertParticipantsInDatabase(
  participants: NewParticipant[],
) {
  const conn = await open_database();
  const st = conn.prepare(
    "INSERT INTO participants(first_name, family_name, username, discord_username, discord_id, is_staff, is_donator, points) VALUES(?, ?, ?, ?, ?, ?, ?, ?)",
  );
  participants.forEach((p) =>
    st.run(
      p.first_name,
      p.family_name,
      p.username,
      p.discord_username,
      p.discord_id,
      p.is_staff ? 1 : 0,
      p.is_donator ? 1 : 0,
      0,
    ),
  );
}

function dbToParticipant(dbp: DBParticipant): Participant {
  return {
    ...dbp,
    is_staff: dbp.is_staff === 1,
    is_donator: dbp.is_donator === 1,
  };
}

export async function getParticipants(): Promise<Participant[]> {
  const conn = await open_database();
  const st = conn.prepare<[], DBParticipant>("SELECT * FROM participants");
  return st.all().map(dbToParticipant);
}

export async function getParticipantFromDiscordId(
  discord_id: string,
): Promise<Participant> {
  const conn = await open_database();
  const st = conn.prepare<string, DBParticipant>(
    "SELECT * FROM participants WHERE discord_id = ?",
  );
  const participant = st.get(discord_id);
  if (!participant) {
    throwError({ type: "not_found", message: "DB participant not found." });
  }
  return dbToParticipant(participant);
}

export async function getParticipant(id: number): Promise<Participant> {
  const conn = await open_database();
  const st = conn.prepare<number, DBParticipant>(
    "SELECT * FROM participants WHERE id = ?",
  );
  const participant = st.get(id);
  if (!participant) {
    throwError({ type: "not_found", message: "DB participant not found." });
  }
  return dbToParticipant(participant);
}

export async function dropParticipantsTable() {
  const conn = await open_database();
  const st = conn.prepare("DROP TABLE IF EXISTS participants");
  st.run();
}

export async function deleteParticipant(discord_id: string) {
  const conn = await open_database();
  const st = conn.prepare("DELETE FROM participants WHERE discord_id = ?");
  st.run(discord_id);
}

export async function toggleStaffStatus(discord_id: string) {
  const conn = await open_database();
  const st = conn.prepare(
    "UPDATE participants SET is_staff = NOT is_staff WHERE discord_id = ?",
  );
  st.run(discord_id);
}

export async function toggleDonatorStatus(discord_id: string) {
  const conn = await open_database();
  const st = conn.prepare(
    "UPDATE participants SET is_donator = NOT is_donator WHERE discord_id = ?",
  );
  st.run(discord_id);
}
