import { REST, Routes } from "discord.js";
import { data as taskCommand } from "./commands/task";
import { data as teamCommand } from "./commands/team";

if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_CLIENT_ID) {
  throw new Error("DISCORD_TOKEN and DISCORD_CLIENT_ID are required");
}

const token: string = process.env.DISCORD_TOKEN;
const clientId: string = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

const commands = [taskCommand.toJSON(), teamCommand.toJSON()];

const rest = new REST({ version: "10" }).setToken(token);

async function deploy() {
  console.log(`Deploying ${commands.length} commands...`);

  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });
    console.log(`Commands deployed to guild ${guildId}`);
  } else {
    await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });
    console.log("Commands deployed globally");
  }
}

deploy().catch(console.error);
