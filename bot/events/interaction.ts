import type { Interaction } from "discord.js";
import * as taskCommand from "../commands/task";
import * as teamCommand from "../commands/team";

const commands = new Map<
  string,
  { execute: (interaction: never) => Promise<void> }
>();
commands.set(taskCommand.data.name, taskCommand);
commands.set(teamCommand.data.name, teamCommand);

export async function handleInteraction(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;

  console.log(`[bot:cmd] /${interaction.commandName} ${interaction.options.getSubcommand(false) ?? ""} by ${interaction.user.tag}`);

  const command = commands.get(interaction.commandName);
  if (!command) {
    console.warn(`[bot:cmd] Unknown command: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction as never);
    console.log(`[bot:cmd] /${interaction.commandName} completed`);
  } catch (err) {
    console.error(`[bot:cmd] Error executing /${interaction.commandName}:`, err);
    const reply = {
      content: "Something went wrong executing that command.",
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
}
