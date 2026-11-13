import { open_database } from "./main";
import type { Participant } from "./model";

export async function insertParticipantInDatabase(
    family_name: string,
    first_name: string,
    username: string,
    discord_username: string,
    discord_id: string,
    is_staff: boolean,
) {
    const conn = await open_database();
    const st = conn.prepare(
        "INSERT INTO participants(first_name, family_name, username, discord_username, discord_id, is_staff, points) VALUES(?, ?, ?, ?, ?, ?, ?)",
    );
    st.run(first_name, family_name, username, discord_username, discord_id, is_staff ? 1 : 0, 0);
}

export async function getParticipants(): Promise<Participant[]> {
    const conn = await open_database();
    const st = conn.prepare("SELECT * FROM participants");
    return st.all() as Participant[];
}

export async function getParticipant(discord_id: string): Promise<Participant | null> {
    const conn = await open_database();
    const st = conn.prepare("SELECT * FROM participants WHERE discord_id = ?");
    const participant = st.get(discord_id) as Participant | undefined;
    return participant ?? null;
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
    const st = conn.prepare("UPDATE participants SET is_staff = NOT is_staff WHERE discord_id = ?");
    st.run(discord_id);
}
