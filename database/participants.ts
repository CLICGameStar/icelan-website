import { open_database } from "./main";
import type { Participant } from "./model";

export async function insertParticipantInDatabase(p: Participant) {
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

export async function insertParticipantsInDatabase(participants: Participant[]) {
    const conn = await open_database();
    const st = conn.prepare(
        "INSERT INTO participants(first_name, family_name, username, discord_username, discord_id, is_staff, is_donator, points) VALUES(?, ?, ?, ?, ?, ?, ?, ?)",
    );
    participants.forEach(p =>
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

export async function toggleDonatorStatus(discord_id: string) {
    const conn = await open_database();
    const st = conn.prepare("UPDATE participants SET is_donator = NOT is_donator WHERE discord_id = ?");
    st.run(discord_id);
}

export async function setParticipantPoints(discord_id: string, points: number) {
    const conn = await open_database();
    const st = conn.prepare("UPDATE participants SET points = ? WHERE discord_id = ?");
    st.run(points, discord_id);
}

export async function addParticipantPoints(discord_id: string, points: number) {
    const conn = await open_database();

    let st = conn.prepare("SELECT points FROM participants WHERE discord_id = ?");
    const pts = st.get(discord_id) as number;

    setParticipantPoints(discord_id, pts + points);
}
