import type { Message } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { createTask } from "../lib/api-client";

const TASK_KEYWORDS = [
  "we need to",
  "we should",
  "let's build",
  "let's add",
  "let's implement",
  "can we add",
  "can we build",
  "todo:",
  "task:",
  "feature request:",
  "bug:",
];

export async function handleMessage(message: Message) {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();
  const matched = TASK_KEYWORDS.some((kw) => content.includes(kw));
  if (!matched) return;

  const title = extractTitle(message.content);
  if (!title || title.length < 5) return;

  console.log(`[bot:msg] Task detected from ${message.author.tag}: "${title}"`);

  const embed = new EmbedBuilder()
    .setTitle("Task detected")
    .setDescription(
      `**"${title}"**\n\nReact with \u{2705} to create this as a task.`,
    )
    .setColor(0xf2994a)
    .setFooter({ text: `From ${message.author.displayName}` });

  const reply = await message.reply({ embeds: [embed] });
  await reply.react("\u{2705}");

  const filter = (
    reaction: { emoji: { name: string | null } },
    user: { bot: boolean },
  ) => reaction.emoji.name === "\u{2705}" && !user.bot;

  try {
    const collected = await reply.awaitReactions({
      filter,
      max: 1,
      time: 60_000,
    });

    if (collected.size > 0) {
      console.log(`[bot:msg] Reaction confirmed, creating task: "${title}"`);
      const { task } = await createTask({
        name: title,
        description: message.content,
      });
      console.log(`[bot:msg] Task created: ${task.identifier}`, { githubIssueUrl: task.githubIssueUrl });

      const confirmEmbed = new EmbedBuilder()
        .setTitle(`${task.identifier} created`)
        .setDescription(task.name)
        .setColor(0x6fcf97);

      if (task.githubIssueUrl) {
        confirmEmbed.addFields({
          name: "GitHub Issue",
          value: `[View](${task.githubIssueUrl})`,
        });
      }

      await reply.edit({ embeds: [confirmEmbed] });
    } else {
      console.log(`[bot:msg] Task creation timed out for: "${title}"`);
      await reply.edit({
        embeds: [
          new EmbedBuilder()
            .setDescription("Task creation timed out.")
            .setColor(0x95a2b3),
        ],
      });
    }
  } catch (err) {
    console.error("[bot:msg] Reaction collection error:", err);
  }
}

function extractTitle(content: string): string {
  for (const keyword of TASK_KEYWORDS) {
    const idx = content.toLowerCase().indexOf(keyword);
    if (idx !== -1) {
      const after = content.slice(idx + keyword.length).trim();
      const firstLine = after.split("\n")[0]?.trim() ?? "";
      const cleaned = firstLine.replace(/[.!?]+$/, "").trim();
      return cleaned.slice(0, 100);
    }
  }
  return content.slice(0, 100);
}
