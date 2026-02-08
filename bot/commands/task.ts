import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import {
  createTask,
  getTasks,
  getTask,
  approveTask,
  updateTask,
} from "../lib/api-client";

export const data = new SlashCommandBuilder()
  .setName("task")
  .setDescription("Manage project tasks")
  .addSubcommand((sub) =>
    sub
      .setName("create")
      .setDescription("Create a new task")
      .addStringOption((opt) =>
        opt.setName("title").setDescription("Task title").setRequired(true),
      )
      .addStringOption((opt) =>
        opt.setName("description").setDescription("Task description"),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("approve")
      .setDescription("Approve a task for agent implementation")
      .addStringOption((opt) =>
        opt
          .setName("identifier")
          .setDescription("Task identifier (e.g. BPM-1)")
          .setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("status")
      .setDescription("Check task status")
      .addStringOption((opt) =>
        opt
          .setName("identifier")
          .setDescription("Task identifier (e.g. BPM-1)")
          .setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("list")
      .setDescription("List all tasks")
      .addStringOption((opt) =>
        opt
          .setName("column")
          .setDescription("Filter by column")
          .addChoices(
            { name: "Backlog", value: "backlog" },
            { name: "Active", value: "active" },
            { name: "Awaiting Close", value: "in-review" },
            { name: "Production", value: "production" },
          ),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("assign")
      .setDescription("Assign a task to an engineer")
      .addStringOption((opt) =>
        opt
          .setName("identifier")
          .setDescription("Task identifier (e.g. BPM-1)")
          .setRequired(true),
      )
      .addUserOption((opt) =>
        opt
          .setName("user")
          .setDescription("Engineer to assign")
          .setRequired(true),
      ),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  console.log(`[bot:task] Executing subcommand: ${sub}`);

  switch (sub) {
    case "create":
      return handleCreate(interaction);
    case "approve":
      return handleApprove(interaction);
    case "status":
      return handleStatus(interaction);
    case "list":
      return handleList(interaction);
    case "assign":
      return handleAssign(interaction);
  }
}

async function handleCreate(interaction: ChatInputCommandInteraction) {
  const title = interaction.options.getString("title", true);
  const description = interaction.options.getString("description") ?? undefined;
  console.log(`[bot:task] Creating task: "${title}"`);

  await interaction.deferReply();

  try {
    const { task } = await createTask({ name: title, description });
    console.log(`[bot:task] Task created: ${task.identifier}`, { githubIssueUrl: task.githubIssueUrl });

    const embed = new EmbedBuilder()
      .setTitle(`${task.identifier} - ${task.name}`)
      .setDescription(task.description ?? "No description")
      .setColor(0x2f80ed)
      .addFields(
        { name: "Column", value: task.column, inline: true },
        { name: "Status", value: "Created", inline: true },
      );

    if (task.githubIssueUrl) {
      embed.addFields({
        name: "GitHub Issue",
        value: `[View](${task.githubIssueUrl})`,
        inline: true,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error("[bot:task] Create failed:", err);
    await interaction.editReply("Failed to create task. Is the backend running?");
  }
}

async function handleApprove(interaction: ChatInputCommandInteraction) {
  const identifier = interaction.options.getString("identifier", true);
  console.log(`[bot:task] Approving task: ${identifier}`);

  await interaction.deferReply();

  try {
    const { tasks } = await getTasks();
    const task = tasks.find(
      (t) => t.identifier.toLowerCase() === identifier.toLowerCase(),
    );

    if (!task) {
      console.warn(`[bot:task] Task not found: ${identifier}`);
      await interaction.editReply(`Task \`${identifier}\` not found.`);
      return;
    }

    const { task: approved } = await approveTask(task.id);
    console.log(`[bot:task] Task approved: ${approved.identifier}`);

    const embed = new EmbedBuilder()
      .setTitle(`${approved.identifier} approved`)
      .setDescription(
        `Task **${approved.name}** has been approved for agent implementation.`,
      )
      .setColor(0x6fcf97);

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error("[bot:task] Approve failed:", err);
    await interaction.editReply("Failed to approve task. Is the backend running?");
  }
}

async function handleStatus(interaction: ChatInputCommandInteraction) {
  const identifier = interaction.options.getString("identifier", true);
  console.log(`[bot:task] Checking status: ${identifier}`);

  await interaction.deferReply();

  try {
    const { tasks } = await getTasks();
    const task = tasks.find(
      (t) => t.identifier.toLowerCase() === identifier.toLowerCase(),
    );

    if (!task) {
      console.warn(`[bot:task] Task not found: ${identifier}`);
      await interaction.editReply(`Task \`${identifier}\` not found.`);
      return;
    }

    const columnEmoji: Record<string, string> = {
      backlog: "\u{26AA}",
      active: "\u{1F7E0}",
      "in-review": "\u{1F535}",
      production: "\u{1F7E3}",
    };

    const embed = new EmbedBuilder()
      .setTitle(`${task.identifier} - ${task.name}`)
      .setDescription(task.description ?? "No description")
      .setColor(0x2f80ed)
      .addFields(
        {
          name: "Column",
          value: `${columnEmoji[task.column] ?? ""} ${task.column}`,
          inline: true,
        },
        {
          name: "Agent",
          value: task.agentStatus ?? "idle",
          inline: true,
        },
      );

    if (task.labels?.length) {
      embed.addFields({
        name: "Labels",
        value: task.labels.map((l) => `\`${l.name}\``).join(" "),
      });
    }

    if (task.githubIssueUrl) {
      embed.addFields({
        name: "Links",
        value: [
          task.githubIssueUrl ? `[Issue](${task.githubIssueUrl})` : null,
          task.prUrl ? `[PR](${task.prUrl})` : null,
        ]
          .filter(Boolean)
          .join(" | "),
      });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error("[bot:task] Status failed:", err);
    await interaction.editReply("Failed to get task status. Is the backend running?");
  }
}

async function handleList(interaction: ChatInputCommandInteraction) {
  const column = interaction.options.getString("column");
  console.log(`[bot:task] Listing tasks`, column ? `in column: ${column}` : "(all)");

  await interaction.deferReply();

  try {
    const { tasks } = await getTasks();
    const filtered = column
      ? tasks.filter((t) => t.column === column)
      : tasks;

    if (!filtered.length) {
      await interaction.editReply(
        column ? `No tasks in **${column}**.` : "No tasks found.",
      );
      return;
    }

    const lines = filtered.map(
      (t) => `\`${t.identifier}\` ${t.name} — *${t.column}*`,
    );

    const embed = new EmbedBuilder()
      .setTitle(column ? `Tasks in ${column}` : "All Tasks")
      .setDescription(lines.join("\n"))
      .setColor(0x95a2b3)
      .setFooter({ text: `${filtered.length} task(s)` });

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error("[bot:task] List failed:", err);
    await interaction.editReply("Failed to list tasks. Is the backend running?");
  }
}

async function handleAssign(interaction: ChatInputCommandInteraction) {
  const identifier = interaction.options.getString("identifier", true);
  const user = interaction.options.getUser("user", true);
  console.log(`[bot:task] Assigning ${identifier} to ${user.tag}`);

  await interaction.deferReply();

  try {
    const { tasks } = await getTasks();
    const task = tasks.find(
      (t) => t.identifier.toLowerCase() === identifier.toLowerCase(),
    );

    if (!task) {
      console.warn(`[bot:task] Task not found: ${identifier}`);
      await interaction.editReply(`Task \`${identifier}\` not found.`);
      return;
    }

    await updateTask(task.id, { column: "active" });
    console.log(`[bot:task] Task ${identifier} assigned and moved to active`);

    await interaction.editReply(
      `Task \`${task.identifier}\` assigned to ${user.toString()} and moved to **active**.`,
    );
  } catch (err) {
    console.error("[bot:task] Assign failed:", err);
    await interaction.editReply("Failed to assign task. Is the backend running?");
  }
}
