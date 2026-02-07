import { Client, GatewayIntentBits } from "discord.js";
import { handleInteraction } from "./events/interaction";
import { handleMessage } from "./events/message-create";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

if (!DISCORD_TOKEN) {
  throw new Error("DISCORD_TOKEN is required");
}

console.log("[bot] Starting bot...");
console.log("[bot] BACKEND_URL:", process.env.BACKEND_URL || "http://localhost:3001");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.once("ready", (c) => {
  console.log(`[bot] Online as ${c.user.tag}`);
  console.log(`[bot] Serving ${c.guilds.cache.size} guild(s)`);
});

client.on("error", (err) => {
  console.error("[bot] Client error:", err);
});

client.on("interactionCreate", handleInteraction);
client.on("messageCreate", handleMessage);

client.login(DISCORD_TOKEN);
