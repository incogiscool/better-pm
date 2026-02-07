import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { getEngineers, createEngineer } from "../lib/api-client";

export const data = new SlashCommandBuilder()
  .setName("team")
  .setDescription("Manage team members")
  .addSubcommand((sub) =>
    sub
      .setName("add")
      .setDescription("Add a team member")
      .addUserOption((opt) =>
        opt.setName("user").setDescription("Discord user").setRequired(true),
      )
      .addStringOption((opt) =>
        opt
          .setName("email")
          .setDescription("Email address")
          .setRequired(true),
      )
      .addStringOption((opt) =>
        opt.setName("github").setDescription("GitHub username"),
      )
      .addStringOption((opt) =>
        opt.setName("skills").setDescription("Comma-separated skills"),
      ),
  )
  .addSubcommand((sub) =>
    sub.setName("list").setDescription("List all team members"),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  console.log(`[bot:team] Executing subcommand: ${sub}`);

  switch (sub) {
    case "add":
      return handleAdd(interaction);
    case "list":
      return handleList(interaction);
  }
}

async function handleAdd(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user", true);
  const email = interaction.options.getString("email", true);
  const github = interaction.options.getString("github") ?? undefined;
  const skillsStr = interaction.options.getString("skills");
  const skills = skillsStr
    ? skillsStr.split(",").map((s) => s.trim())
    : undefined;

  console.log(`[bot:team] Adding member: ${user.tag}`, { email, github, skills });

  await interaction.deferReply();

  try {
    const { engineer } = await createEngineer({
      name: user.displayName,
      email,
      discordId: user.id,
      githubUsername: github,
      skills,
    });
    console.log(`[bot:team] Engineer created: ${engineer.id}`);

    const embed = new EmbedBuilder()
      .setTitle("Team member added")
      .setDescription(`${user.toString()} has been registered.`)
      .setColor(0x6fcf97)
      .addFields(
        { name: "Name", value: engineer.name, inline: true },
        { name: "Email", value: engineer.email, inline: true },
      );

    if (engineer.githubUsername) {
      embed.addFields({
        name: "GitHub",
        value: engineer.githubUsername,
        inline: true,
      });
    }

    if (engineer.skills?.length) {
      embed.addFields({
        name: "Skills",
        value: engineer.skills.map((s) => `\`${s}\``).join(" "),
      });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error("[bot:team] Add member failed:", err);
    await interaction.editReply("Failed to add team member. Is the backend running?");
  }
}

async function handleList(interaction: ChatInputCommandInteraction) {
  console.log("[bot:team] Listing team members");
  await interaction.deferReply();

  try {
    const { engineers } = await getEngineers();
    console.log(`[bot:team] Found ${engineers.length} engineers`);

    if (!engineers.length) {
      await interaction.editReply("No team members registered yet.");
      return;
    }

    const lines = engineers.map((e) => {
      const parts = [`**${e.name}**`];
      if (e.githubUsername) parts.push(`(@${e.githubUsername})`);
      if (e.skills?.length)
        parts.push(`— ${e.skills.map((s) => `\`${s}\``).join(" ")}`);
      return parts.join(" ");
    });

    const embed = new EmbedBuilder()
      .setTitle("Team Members")
      .setDescription(lines.join("\n"))
      .setColor(0x2f80ed)
      .setFooter({ text: `${engineers.length} member(s)` });

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error("[bot:team] List failed:", err);
    await interaction.editReply("Failed to list team members. Is the backend running?");
  }
}
