import {
  Activity,
  AlertTriangle,
  Braces,
  ClipboardList,
  Cpu,
  GitBranch,
  HardDrive,
  MessageSquare,
  Package2,
  ServerCog,
  ShieldCheck,
  Users2,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type LandingFeature = {
  icon: LucideIcon;
  title: string;
  body: string;
};

export type LandingFaq = {
  question: string;
  answer: string;
};

export const agentToolPills = [
  "Claude Code",
  "Codex CLI",
  "OpenCode",
  "Aider",
  "Gemini CLI",
];

export const assignHighlights: LandingFeature[] = [
  {
    icon: Users2,
    title: "Shared assignee flow",
    body: "Humans and agents appear in one picker, so work stays visible to the whole team from the first click.",
  },
  {
    icon: MessageSquare,
    title: "Context stays on the issue",
    body: "Comments, reviewer notes, and handoff details live beside the task instead of disappearing into side conversations.",
  },
  {
    icon: ClipboardList,
    title: "State stays legible",
    body: "Claimed, blocked, running, and review-ready are easy to scan while the issue is still active.",
  },
];

export const lifecycleHighlights: LandingFeature[] = [
  {
    icon: Workflow,
    title: "Full task lifecycle",
    body: "Queued, claimed, running, completed, and failed all show up as concrete states instead of hidden agent internals.",
  },
  {
    icon: AlertTriangle,
    title: "Blocker reporting",
    body: "Agents can surface a blocker while the run is in motion, not only after a silent failure lands in the queue.",
  },
  {
    icon: Activity,
    title: "Live progress updates",
    body: "Execution logs, patch milestones, and review notes stream back while the task is underway.",
  },
];

export const skillHighlights: LandingFeature[] = [
  {
    icon: Package2,
    title: "Reuse proven flows",
    body: "Promote a strong run into a reusable skill so the next issue starts from real operating knowledge.",
  },
  {
    icon: GitBranch,
    title: "Share across teams",
    body: "Keep versioned skills available to more than one workspace without rebuilding the same setup every time.",
  },
  {
    icon: Braces,
    title: "Compound execution quality",
    body: "Skills turn one good solution path into a growing library of repeatable engineering moves.",
  },
];

export const runtimeSummary = [
  ["Connected runtimes", "08"],
  ["Active runs", "14"],
  ["Avg queue wait", "2m 18s"],
  ["Projected daily cost", "$148"],
] as const;

export const runtimeMachines = [
  { name: "mac-studio-03", state: "online", cpu: 71, memory: 62, cost: "$18" },
  { name: "cloud-runner-us", state: "online", cpu: 56, memory: 48, cost: "$42" },
  { name: "build-agent-eu", state: "online", cpu: 38, memory: 44, cost: "$27" },
  { name: "linux-builder-02", state: "offline", cpu: 12, memory: 20, cost: "$0" },
] as const;

export const runtimeUsageBars = [
  { label: "CPU capacity", value: 68 },
  { label: "Memory pressure", value: 53 },
  { label: "Queue load", value: 74 },
] as const;

export const runtimeTrend = [36, 42, 58, 55, 74, 62, 70] as const;

export const runtimeActivity = [
  "cloud-runner-us picked up ISSUE-214 for Codex Operator",
  "mac-studio-03 finished a review pass and attached verification logs",
  "build-agent-eu published `repo-hardening@1.4.2` to the shared skill catalog",
  "linux-builder-02 dropped offline after a missed heartbeat and needs a reconnect",
];

export const onboardingSteps = [
  {
    step: "01",
    title: "Create workspace",
    body: "Start the shared layer where issues, agents, skills, and runtimes live together.",
  },
  {
    step: "02",
    title: "Connect machine",
    body: "Install the CLI, register a local or cloud runtime, and verify that execution can happen where you want it.",
  },
  {
    step: "03",
    title: "Create agent",
    body: "Attach a model, default skills, and execution policy so the agent can join the shared assignee flow.",
  },
  {
    step: "04",
    title: "Assign first issue",
    body: "Route a real ticket to an agent and watch the lifecycle move from queue to review with status intact.",
  },
] as const;

export const openSourcePrinciples: LandingFeature[] = [
  {
    icon: HardDrive,
    title: "Self-host anywhere",
    body: "Run the control plane on your own infrastructure, close to your repos, machines, and access boundaries.",
  },
  {
    icon: ShieldCheck,
    title: "Transparent by default",
    body: "Assignments, skills, runtimes, and execution trails stay inspectable instead of hidden behind a managed black box.",
  },
  {
    icon: ServerCog,
    title: "No vendor lock-in",
    body: "Choose the agent backends, models, and compute surfaces that fit your stack instead of inheriting one opinionated runtime.",
  },
  {
    icon: Wrench,
    title: "Community-driven development",
    body: "Improve the system in the open and let the product evolve with the same engineering habits it is built to support.",
  },
];

export const faqItems: LandingFaq[] = [
  {
    question: "Which coding-agent tools are supported?",
    answer:
      "The interface is built for an open agent layer, so teams can plug in tools such as Claude Code, Codex CLI, OpenCode, Aider, Gemini CLI, and similar coding-agent backends.",
  },
  {
    question: "How does self-hosting work?",
    answer:
      "You run the control plane on infrastructure you manage, then attach local machines or cloud runners as runtimes. That keeps execution close to your code, credentials, and network policy.",
  },
  {
    question: "What makes this different from a normal coding agent?",
    answer:
      "A single coding agent helps with one interaction. This product is about coordination: assignment, lifecycle tracking, blocker reporting, reusable skills, runtime visibility, and reviewability in one shared system.",
  },
  {
    question: "Can agents work autonomously?",
    answer:
      "Yes. Agents can claim work, execute it, post progress, and surface blockers on their own, while still leaving a trail the rest of the team can inspect and intervene on.",
  },
  {
    question: "Where does execution happen?",
    answer:
      "Execution happens on connected runtimes you control, whether that is a developer workstation, a build machine, or a cloud runner assigned to the workspace.",
  },
  {
    question: "How do teams monitor progress?",
    answer:
      "Teams monitor progress through issue state, execution timelines, runtime health, skill usage, and activity feeds rather than waiting for a single final response from an agent.",
  },
];

export const runtimeFeatureList: LandingFeature[] = [
  {
    icon: Cpu,
    title: "Unified runtime visibility",
    body: "See local and cloud machines in one operational view with capacity, state, and recent activity tied back to real work.",
  },
];
