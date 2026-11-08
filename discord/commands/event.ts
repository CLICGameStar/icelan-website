import { open_database } from "@/database/main";
import type { Participants as Participant } from "@/database/model";
import { directus } from "@/directus";
import type { IcelanParticipant } from "@/directus-config/types/aliases";
import { readItems } from "@directus/sdk";
import type { DiscordCommand } from "../discord";

const START_ICELAN_CMD: DiscordCommand = {
    name: "start_icelan",
    description: "Start ICeLAN",
    async handler(interaction) {
        const directus_particpants = (await directus().request(
            readItems("icelan_participants"),
        )) as IcelanParticipant[];

        let conn = await open_database();
        let st = conn.prepare(
            "INSERT INTO participants(username, discord_username) VALUES(@icelan_username, @discord_username)",
        );
        st.all(directus_particpants);

        st = conn.prepare("SELECT * FROM participants WHERE id = ?");
        let participant = st.all() as Participant[];
        interaction.reply(JSON.stringify(participant));
    },
};

export const EVENT_COMMANDS = [START_ICELAN_CMD];
