import {
  getParticipant,
  getParticipantFromDiscordId,
} from "@/database/participants";
import {
  deleteBonusPoints,
  getAllBonusPoints,
  getBonusPoints,
  getBonusPointsFromParticipantId,
  getPoints,
  insertBonusPoints,
  insertRankingPoints,
  RankingPoint,
} from "@/database/points";
import {
  ApplicationCommandOptionType,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { DiscordCommand } from "../discord";
import { throwError } from "../error";

const SET_RANKING_POINTS: DiscordCommand = {
  name: "set_ranking_points",
  description: "[ADMIN] Set points awarded given rank and number of team",
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [
    {
      name: "number_of_teams",
      description:
        "list of number of teams to set points for. Format: x1 x2 ... xN",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "points",
      description: "List of list of points. Format: x1 ... xN-y1 ... yN-...",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  async handler(interaction) {
    const notsString = interaction.options.getString("number_of_teams") ?? "";
    const pointsString = interaction.options.getString("points") ?? "";

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const nots = notsString.split(" ").map((s) => Number(s));
    const points = pointsString
      .split("-")
      .map((ls) => ls.split(" ").map((s) => Number(s)));

    if (nots.length != points.length)
      throwError({
        type: "invalid_data",
        source: "user",
        message:
          "Number of points (" +
          nots.length +
          ") and number of team (" +
          points.length +
          ") not matching",
      });

    let rps: RankingPoint[] = [];
    for (let i = 0; i < nots.length; i++) {
      const not = nots[i];
      const ps = points[i];

      if (ps.length < 1)
        throwError({
          type: "invalid_data",
          source: "user",
          message:
            "Not enough points entered (" + ps.length + "), command canceled.",
        });
      if (not < 2)
        throwError({
          type: "invalid_data",
          source: "user",
          message:
            "Number of team too small or invalid (" +
            not +
            "), command canceled.",
        });
      if (ps.length > not)
        throwError({
          type: "invalid_data",
          source: "user",
          message:
            "Too many points entered (max. is: " +
            not +
            ", submitted: " +
            ps.length +
            "), command canceled.",
        });

      rps.push({
        number_of_teams: not,
        points: ps,
      });
    }

    try {
      await insertRankingPoints(rps);
    } catch (error) {
      console.log("Failed to insert points with error: " + error);
    }

    await interaction.editReply({
      content:
        "Successfully inserted points in the database. Check with command /get_points_for_number_of_team.",
    });
  },
};

const ADD_POINTS_GIVEN_NUMBER_OF_TEAM: DiscordCommand = {
  name: "add_points_given_number_of_team",
  description: "[ADMIN] Store points awarded given ranking and number of team",
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [
    {
      name: "number_of_team",
      description: "Number of team that could be participating to a tournament",
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
    {
      name: "points",
      description:
        "List of points. Format: x1 x2 ... xn, " +
        "n is the rank and is less than the number of team.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  async handler(interaction) {
    const not = interaction.options.getInteger("number_of_team") ?? -1;
    const pointsString = interaction.options.getString("points") ?? "";

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const points = pointsString.split(" ").map((s) => Number(s));
    if (points.length < 1)
      throwError({
        type: "invalid_data",
        source: "user",
        message:
          "Not enough points entered (" +
          points.length +
          "), command canceled.",
      });
    else if (not < 2)
      throwError({
        type: "invalid_data",
        source: "user",
        message:
          "Number of team too small or invalid (" +
          not +
          "), command canceled.",
      });
    else if (points.length > not)
      throwError({
        type: "invalid_data",
        source: "user",
        message:
          "Too many points entered (max. is: " +
          not +
          ", submitted: " +
          points.length +
          "), command canceled.",
      });
    else {
      try {
        await insertRankingPoints([{ number_of_teams: not, points: points }]);
      } catch (error) {
        console.log("Failed to insert points with error: " + error);
      }
      await interaction.editReply({
        content:
          "Successfully inserted points in the database. Check with command /get_points_for_number_of_team.",
      });
    }
  },
};

const GET_RANKING_POINTS: DiscordCommand = {
  name: "get_ranking_points",
  description: "[ADMIN] Return the points corresponding to the arguments",
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [
    {
      name: "number_of_team",
      description:
        "List of number of team for which to return points. Format: x1 ... xN",
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "rank",
      description: "List of rank for which to return points. Format: x1 ... xN",
      type: ApplicationCommandOptionType.String,
    },
  ],
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const nots = (interaction.options.getString("number_of_team") ?? "")
      .split(" ")
      .map((s) => Number(s));
    const rank = (interaction.options.getString("rank") ?? "")
      .split(" ")
      .map((s) => Number(s));

    let rpsString = "";
    try {
      const rps = (await getPoints()).sort(
        (rp1, rp2) => rp1.number_of_teams - rp2.number_of_teams,
      );
      for (let i = 0; i < rps.length; i++) {
        const rp = rps[i];
        const not = rp.number_of_teams;
        if (nots.includes(not) || nots[0] == 0) {
          rpsString += `Number of team: ${not}, points: ${
            rank[0] == 0
              ? rp.points.map(
                  (p) =>
                    `${rp.points.indexOf(p) != 0 ? " " : ""}${rp.points.indexOf(p) + 1}: ${p}`,
                )
              : rp.points
                  .filter((p) => rank.includes(rp.points.indexOf(p) + 1))
                  .map(
                    (p) =>
                      `${rp.points.indexOf(p) != 0 ? " " : ""}${rp.points.indexOf(p) + 1}: ${p}`,
                  )
          }\n`;
        }
      }
    } catch (error) {
      rpsString = "An error occured: " + error;
    }

    await interaction.editReply({ content: rpsString });
  },
};

const GIVE_BONUS_POINTS: DiscordCommand = {
  name: "give_bonus_points",
  description: "[ADMIN] Give bonus points to a participant",
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [
    {
      name: "participant",
      description: "Participant to give the points to.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "points",
      description: "The amount of points to give",
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
    {
      name: "justification",
      description: "Why do you give these points -_-",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const participant = await getParticipantFromDiscordId(
      interaction.options.getUser("participant")!.id,
    );
    const points = interaction.options.getNumber("points");
    const justification = interaction.options.getString("justification");

    const bp_id = await insertBonusPoints({
      points: points!,
      participant_id: participant.id,
      justification: justification!,
    });
    const bp = await getBonusPoints(bp_id);

    await interaction.editReply({
      content:
        `\`${bp.points}\` points bonus donnés à <@${(await getParticipant(bp.participant_id)).discord_id}>\n` +
        `Raison : ${bp.justification}`,
    });
  },
};

const BONUS_POINTS: DiscordCommand = {
  name: "bonus_points",
  description: "[ADMIN] See what bonus points a participant has.",
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [
    {
      name: "participant",
      description: "The user you want to check.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const participant = await getParticipantFromDiscordId(
      interaction.options.getUser("participant")!.id,
    );
    const bps = await getBonusPointsFromParticipantId(participant.id);

    await interaction.editReply({
      content:
        `## Points bonus de <@${participant.discord_id}>\n` +
        bps
          .map(
            (bp) =>
              `id:\`${bp.id}\`, \`${bp.points}\` pts. bonus : ${bp.justification}\n`,
          )
          .join(""),
    });
  },
};

const REMOVE_BONUS_POINTS: DiscordCommand = {
  name: "remove_bonus_points",
  description: "Remove bonus points from a user.",
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [
    {
      name: "participant",
      description: "The participant you want to remove points from.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "bonus_points_id",
      description: "The ID of the bonus points",
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
  ],
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const participant = await getParticipantFromDiscordId(
      interaction.options.getUser("participant")!.id,
    );
    const bp = await getBonusPoints(
      interaction.options.getNumber("bonus_points_id")!,
    );

    // Check que les points bonus appartiennent bien au participant
    if (bp.participant_id !== participant.id) {
      throwError({
        type: "invalid_data",
        source: "user",
        message: "These bonus points don't belong to the user you specified.",
      });
    }

    deleteBonusPoints(bp.id);

    await interaction.editReply({ content: "Bonus points removed." });
  },
};

const LIST_BONUS_POINTS: DiscordCommand = {
  name: "list_bonus_points",
  description: "[ADMIN] List all bonus points in the database.",
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  async handler(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const bps = await getAllBonusPoints();

    await interaction.editReply({
      content:
        `## Liste des points bonus\n` +
        bps
          .map(
            (bp) =>
              `id:\`${bp.id}\`, participant_id:\`${bp.participant_id}\`, \`${bp.points}\` pts. bonus : ${bp.justification}\n`,
          )
          .join(""),
    });
  },
};

export const POINTS_COMMANDS = [
  ADD_POINTS_GIVEN_NUMBER_OF_TEAM,
  SET_RANKING_POINTS,
  GET_RANKING_POINTS,
  GIVE_BONUS_POINTS,
  BONUS_POINTS,
  REMOVE_BONUS_POINTS,
  LIST_BONUS_POINTS,
];
