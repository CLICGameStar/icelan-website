import { rawSqlQuery } from "@/database/main";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  PermissionFlagsBits,
  type TextChannel,
} from "discord.js";
import {
  client,
  type ComponentInteraction,
  type DiscordCommand,
} from "../discord";
import { throwError } from "../error";
import { LOG_CHANNEL_ID } from "../logging";

const SQL_QUERY: DiscordCommand = {
  name: "sql_query",
  description: "[ADMIN] Run directly an SQL query.",
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [
    {
      name: "query",
      description: "You query",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  async handler(interaction) {
    const query = interaction.options.getString("query");

    const confirm = new ButtonBuilder()
      .setCustomId(`sql_query:${interaction.user.id}:${query}:confirm`)
      .setLabel("Confirmer")
      .setStyle(ButtonStyle.Danger);

    const cafe = new ButtonBuilder()
      .setCustomId(`sql_query:${interaction.user.id}:${query}:cafe`)
      .setLabel("Café")
      .setStyle(ButtonStyle.Danger);

    const cancel = new ButtonBuilder()
      .setCustomId(`sql_query:${interaction.user.id}:${query}:cancel`)
      .setLabel("Annuler")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      confirm,
      cafe,
      cancel,
    );

    const channel = (await client.channels.fetch(
      LOG_CHANNEL_ID,
    )) as TextChannel;

    await channel.send({
      content: `<@&1573014452016648274>\n<@${interaction.user.id}> souhaite faire cette query SQL. Qqun avec les perms admin doit la relire puis l'accepter.\n\`\`\`\n${query}\n\`\`\``,
      components: [row],
    });

    await interaction.reply({
      content: "Demande envoyée",
      flags: MessageFlags.Ephemeral,
    });
  },
};

const SQL_CONFIRM: ComponentInteraction = {
  name: "sql_query",
  async handler(interaction, args) {
    if (
      !(await interaction.memberPermissions?.has(
        PermissionFlagsBits.Administrator,
      ))
    ) {
      await interaction.reply({
        content: "T pas admin >:(",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (interaction.user.id === args[0]) {
      await interaction.reply({
        content: "Tu ne peut pas te review toi-même >:(",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    switch (args[2]) {
      case "confirm":
        try {
          const res = await rawSqlQuery(args[1]);
          await interaction.reply({
            content: `<@${args[0]}> ta réponse :\n` + JSON.stringify(res),
          });
        } catch (error) {
          await interaction.reply(
            "La query a fail :\n" + JSON.stringify(error),
          );
        }
        await interaction.message.delete();
        break;
      case "cafe":
        await interaction.reply({
          content: "Mauvais boutton Tim -_-",
          flags: MessageFlags.Ephemeral,
        });
        break;
      case "cancel":
        await interaction.reply({ content: "Opération annulée." });
        await interaction.message.delete();
        break;
      default:
        throwError({
          type: "invalid_data",
          source: "other",
          message: "invalid customId",
        });
    }
  },
};

export const ADMIN_UTIL_COMMANDS = [SQL_QUERY];
export const ADMIN_INTERACTION_COMPONENTS = [SQL_CONFIRM];
