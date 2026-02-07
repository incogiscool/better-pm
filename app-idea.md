Better PM — Product Overview

What we're building:

An AI-powered project management system that turns Discord conversations into completed code — automatically. A central Kanban board is the single source of truth, with every ticket linked to a GitHub issue.

The flow:

Discord → Bot detects task → Creates ticket on Kanban + GitHub issue (linked)
                                         ↓
                              Engineer approves → Agent implements
                                         ↓
                              Review → Deploy → Production
Kanban Board — The Single Source of Truth

All tickets live here. When the Discord bot detects a task, it:

1. Creates a ticket on our Kanban board
2. Creates a linked GitHub issue
3. Assigns an engineer
   Each ticket shows:

• Title & description
• Assigned engineer (with avatar)
• Linked GitHub issue (clickable)
• Status (Backlog → Active → In Review → Ready to Deploy → Production)
• Live status updates ("Agent is writing component...", "PR created", etc.)
• Click to expand → full agent session history

Columns:

| Column           | What's happening                               |
| ---------------- | ---------------------------------------------- |
| Backlog          | Ticket created, waiting for engineer approval  |
| Active           | Engineer said "implement" — agent is working   |
| In Review        | Agent finished — PR linked to GitHub issue     |
| Ready to Deploy  | Review passed — waiting for deploy approval    |
| Production       | Shipped — changes live                         |

The full flow:

1. Discord: Someone says "we need a dark mode toggle"
2. Bot detects the task
3. Bot checks knowledge base → finds best engineer (Alex, frontend expert)
4. Bot creates ticket on Kanban board + GitHub issue (linked)
5. Bot pings Alex in Discord with link to ticket
6. Alex reviews ticket on board, chats with bot to refine
7. Alex approves → "Yes, implement it"
8. Ticket moves to Active — agent starts working
9. Agent commits to branch, references GitHub issue
10. Agent finishes → creates PR (linked to issue) → ticket moves to In Review
11. Alex reviews PR → approves
12. Ticket moves to Production → merged → deployed
13. Website updates live

What we're demoing:

A fake software company using Better PM:

• Discord message → ticket + GitHub issue created
• Engineer approves → agent works
• PR links back to issue
• Team watches progress on Kanban board
• Code ships → website updates live

Team split:

| Person    | Responsibility                                                                                                  |
| --------- | --------------------------------------------------------------------------------------------------------------- |
| Person 1  | Discord bot (monitors channel, detects tasks, creates tickets via API, creates GitHub issues, pings engineers)  |
| Person 2  | Kanban frontend (board UI, tickets with GitHub issue links, agent session viewer, real-time updates)            |
| Sardor    | Fake company setup (fork open-source repo, product docs, team knowledge base) + agent integration               |

Tech stack:

• Discord bot: Discord.js or Python
• Frontend: Next.js + Base UI + Tailwind
• Database: Neon (tickets, sessions, team data)
• Agents: Claude (Anthropic)
• Code review: CodeRabbit
• Hosting: Vercel
• Issues/PRs: GitHub
