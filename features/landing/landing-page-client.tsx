"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { buttonVariants } from "@/components/ui/Button";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import {
  agentToolPills,
  assignHighlights,
  faqItems,
  lifecycleHighlights,
  onboardingSteps,
  openSourcePrinciples,
  runtimeActivity,
  runtimeMachines,
  runtimeSummary,
  runtimeTrend,
  runtimeUsageBars,
  skillHighlights,
  type LandingFeature,
} from "./landing-content";

function RevealSection({
  children,
  className,
  delay = 0,
  id,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      id={id}
      ref={ref}
      className={cn(
        "scroll-mt-28 transition-all duration-700 ease-out motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p className="landing-kicker">{children}</p>;
}

function SectionIntro({
  eyebrow,
  title,
  body,
  className,
}: {
  eyebrow: string;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-[34rem]", className)}>
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <h2 className="font-display mt-4 text-balance text-[2.6rem] leading-[0.95] text-white sm:text-[3.35rem]">
        {title}
      </h2>
      <p className="mt-5 max-w-[33rem] text-base leading-8 text-[#98a6b5]">{body}</p>
    </div>
  );
}

function SupportTile({ icon: Icon, title, body }: LandingFeature) {
  return (
    <article className="landing-subpanel hover-lift h-full rounded-[1.5rem] p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/8 bg-white/[0.04] text-[#63d6cb]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-lg text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#98a6b5]">{body}</p>
    </article>
  );
}

function MiniBar({
  label,
  value,
  tone = "accent",
}: {
  label: string;
  value: number;
  tone?: "accent" | "muted";
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#97a5b4]">{label}</span>
        <span className="text-white">{value}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/8">
        <div
          className={cn(
            "h-2 rounded-full",
            tone === "accent"
              ? "bg-gradient-to-r from-[#2aa89f] to-[#78e2da]"
              : "bg-gradient-to-r from-[#405366] to-[#73849a]"
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="px-6 pb-20 pt-8 sm:pt-10">
      <div className="mx-auto grid max-w-[1320px] gap-12 lg:min-h-[calc(100svh-94px)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
        <RevealSection className="max-w-[34rem]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[0.7rem] uppercase tracking-[0.2em] text-[#9aa7b6]">
            <span className="h-2 w-2 rounded-full bg-[#63d6cb]" />
            Open-source control plane for coding agents
          </div>

          <h1 className="font-display mt-7 text-balance text-[3.6rem] leading-[0.88] text-white sm:text-[4.9rem]">
            The next teammate you assign might boot from a terminal.
          </h1>

          <p className="mt-6 max-w-[32rem] text-lg leading-8 text-[#a1adba]">
            Run human and AI agent work in one system. Assign issues, watch live execution, reuse skills,
            monitor runtimes, and keep the whole stack self-hostable.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/board" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
              Open live board
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/onboarding" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2")}>
              Start onboarding
            </Link>
          </div>

          <div className="mt-10">
            <p className="landing-kicker">Works with</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {agentToolPills.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-[#d7dde5]"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-5 text-sm text-[#8493a3]">
            <span>Issue assignment for humans and agents</span>
            <span>Reusable skill packages</span>
            <span>Self-hosted runtime visibility</span>
          </div>
        </RevealSection>

        <RevealSection delay={90}>
          <HeroProductPlane />
        </RevealSection>
      </div>
    </section>
  );
}

function HeroProductPlane() {
  return (
    <div className="landing-panel landing-gridlines rounded-[2rem] p-4 sm:p-5">
      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#63d6cb]" />
            </div>
            <div>
              <p className="text-sm text-white">Workspace / agent-ops</p>
              <p className="text-xs uppercase tracking-[0.18em] text-[#7c8a98]">Issue orchestration</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">8 runtimes attached</Badge>
            <Badge variant="running">4 runs live</Badge>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_280px]">
          <aside className="landing-subpanel rounded-[1.5rem] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white">Issue queue</p>
              <span className="text-xs uppercase tracking-[0.16em] text-[#7c8a98]">14 active</span>
            </div>

            <div className="mt-4 space-y-2">
              {[
                ["ISSUE-214", "queued"],
                ["ISSUE-208", "running"],
                ["ISSUE-195", "needs review"],
                ["ISSUE-190", "blocked"],
              ].map(([issue, state], index) => (
                <div
                  key={issue}
                  className={cn(
                    "rounded-[1.1rem] border px-3 py-3",
                    index === 1 ? "border-[#63d6cb]/30 bg-[#0d191d]" : "border-white/6 bg-white/[0.03]"
                  )}
                >
                  <p className="text-sm text-white">{issue}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#7c8a98]">{state}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-white/6 pt-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[#7c8a98]">Assignee mix</p>
              <div className="mt-3 space-y-3">
                {[
                  ["AH", "Asha", "human"],
                  ["CO", "Codex Operator", "agent"],
                  ["RA", "Review Agent", "agent"],
                ].map(([initials, name, role]) => (
                  <div key={name} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.05] text-xs text-white">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">{name}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-[#7c8a98]">{role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="rounded-[1.5rem] border border-white/7 bg-[#0a0f16]/96 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/6 pb-4">
              <div>
                <p className="font-mono-ui text-[0.7rem] uppercase tracking-[0.22em] text-[#7c8a98]">
                  ISSUE-208
                </p>
                <h3 className="mt-2 max-w-[36rem] text-[1.35rem] leading-tight text-white">
                  Add retry visibility and unblock failure triage for the sync worker
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="running">claimed</Badge>
                <Badge variant="secondary">repo sync</Badge>
                <Badge variant="warning">review later</Badge>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)]">
              <div className="space-y-4">
                <div className="landing-subpanel rounded-[1.25rem] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white">Assignment</p>
                    <span className="text-xs uppercase tracking-[0.16em] text-[#7c8a98]">shared flow</span>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {[
                      { name: "Asha Malik", role: "human", active: false },
                      { name: "Jordan Lee", role: "human", active: false },
                      { name: "Codex Operator", role: "agent", active: true },
                      { name: "Review Agent", role: "agent", active: false },
                    ].map(({ name, role, active }) => (
                      <div
                        key={name}
                        className={cn(
                          "rounded-[1rem] border px-3 py-3",
                          active
                            ? "border-[#63d6cb]/24 bg-[#102021]"
                            : "border-white/6 bg-white/[0.03]"
                        )}
                      >
                        <p className="text-sm text-white">{name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#7c8a98]">{role}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="landing-subpanel rounded-[1.25rem] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white">Progress</p>
                    <span className="text-sm text-[#d7dde5]">74%</span>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-white/8">
                    <div className="h-2 w-[74%] rounded-full bg-gradient-to-r from-[#2aa89f] to-[#78e2da]" />
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-[#98a6b5]">
                    <p>Selected 9 files from the sync worker and retry policy layers.</p>
                    <p>Draft patch prepared and focused verification queued on the preferred runtime.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="landing-subpanel rounded-[1.25rem] p-4">
                  <p className="text-sm text-white">Run stream</p>
                  <div className="mt-4 space-y-3">
                    {[
                      ["14:08", "Claimed by Codex Operator"],
                      ["14:12", "Connected cloud-runner-us"],
                      ["14:18", "Posted execution checkpoint"],
                      ["14:24", "Queued verification for targeted suites"],
                    ].map(([time, line]) => (
                      <div key={line} className="rounded-[1rem] border border-white/6 bg-white/[0.02] px-3 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-[#6f7d8a]">{time}</p>
                        <p className="mt-1 text-sm text-[#d7dde5]">{line}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="landing-terminal rounded-[1.25rem] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white">Execution log</p>
                    <span className="text-xs uppercase tracking-[0.16em] text-[#7c8a98]">live</span>
                  </div>
                  <div className="mt-4 space-y-2 font-mono-ui text-[0.82rem] text-[#b8f4ee]">
                    <p>$ resolve-context sync-worker retry-policy metrics.ts</p>
                    <p>$ attach-skill repo-hardening@1.4.2</p>
                    <p>$ run verify --suite sync --suite workers</p>
                    <p className="text-[#8da0b1]">$ awaiting reviewer note on flaky worker assertion...</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="landing-subpanel rounded-[1.5rem] p-4">
              <p className="text-sm text-white">Attached skills</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["repo-hardening", "review-pr", "sync-triage"].map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-[#d7dde5]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="landing-subpanel rounded-[1.5rem] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white">Runtime health</p>
                <Badge variant="running">healthy</Badge>
              </div>
              <div className="mt-4 space-y-4">
                <MiniBar label="CPU" value={67} />
                <MiniBar label="Memory" value={54} />
                <MiniBar label="Network" value={33} tone="muted" />
              </div>
            </div>

            <div className="landing-subpanel rounded-[1.5rem] p-4">
              <p className="text-sm text-white">Recent comments</p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[#98a6b5]">
                <p>
                  <span className="text-white">Asha:</span> Keep retry semantics backward compatible for downstream
                  consumers.
                </p>
                <p>
                  <span className="text-white">Codex Operator:</span> I can preserve defaults and add repository-level
                  overrides.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function AssignSection() {
  return (
    <section className="landing-divider px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-[1320px]">
        <RevealSection id="platform">
          <SectionIntro
            eyebrow="Assign issues to agents"
            title="Put agents in the same assignee flow as the rest of your team."
            body="The issue should remain the center of gravity. Assign an agent from the same picker as a human teammate, keep the discussion in one place, and leave the whole activity trail attached to the work."
            className="max-w-[48rem]"
          />

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {assignHighlights.map((item, index) => (
              <RevealSection key={item.title} delay={index * 80} className="h-full">
                <SupportTile {...item} />
              </RevealSection>
            ))}
          </div>
        </RevealSection>

        <RevealSection delay={90} className="mt-10">
          <div className="landing-panel rounded-[2rem] p-4 sm:p-5">
            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/6 pb-4">
                <div>
                  <p className="font-mono-ui text-[0.7rem] uppercase tracking-[0.22em] text-[#7c8a98]">
                    ISSUE-214
                  </p>
                  <h3 className="mt-2 text-[1.35rem] text-white">
                    Add repository-level retry controls for flaky sync jobs
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="running">claimed</Badge>
                  <Badge variant="secondary">backend</Badge>
                  <Badge variant="warning">needs review</Badge>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)]">
                <div className="space-y-4">
                  <div className="landing-subpanel rounded-[1.4rem] p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white">Assignee picker</p>
                      <span className="text-xs uppercase tracking-[0.16em] text-[#7c8a98]">humans + agents</span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        { name: "Jordan Diaz", role: "human", active: false },
                        { name: "Asha Malik", role: "human", active: false },
                        { name: "Codex Operator", role: "agent", active: true },
                        { name: "Deploy Agent", role: "agent", active: false },
                      ].map(({ name, role, active }) => (
                        <div
                          key={name}
                          className={cn(
                            "rounded-[1.1rem] border px-4 py-4",
                            active
                              ? "border-[#63d6cb]/26 bg-[#102021]"
                              : "border-white/6 bg-white/[0.03]"
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm text-white">{name}</p>
                              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#7c8a98]">{role}</p>
                            </div>
                            {active ? <Badge variant="running">assigned</Badge> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="landing-subpanel rounded-[1.4rem] p-5">
                    <p className="text-sm text-white">Issue context</p>
                    <div className="mt-4 space-y-3 text-sm leading-7 text-[#98a6b5]">
                      <p>Jordan opened the issue after repeated sync failures caused noisy retries in production.</p>
                      <p>Asha added implementation notes and kept the issue in the shared reviewer workflow.</p>
                      <p>Codex Operator claimed the task without leaving the same assignment surface.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="landing-subpanel rounded-[1.4rem] p-5">
                    <p className="text-sm text-white">Comments</p>
                    <div className="mt-4 space-y-3 text-sm leading-7 text-[#98a6b5]">
                      <p>
                        <span className="text-white">Jordan:</span> Please avoid changing default sync timing for large
                        repositories.
                      </p>
                      <p>
                        <span className="text-white">Codex Operator:</span> I can keep current defaults and expose a
                        repository override path.
                      </p>
                      <p>
                        <span className="text-white">Asha:</span> Add one reviewer note before marking this complete.
                      </p>
                    </div>
                  </div>

                  <div className="landing-subpanel rounded-[1.4rem] p-5">
                    <p className="text-sm text-white">Activity feed</p>
                    <div className="mt-4 space-y-2">
                      {[
                        "13:41 issue opened by Jordan",
                        "13:49 implementation notes added by Asha",
                        "13:53 claimed by Codex Operator",
                        "14:11 execution checkpoint posted",
                        "14:19 moved toward review",
                      ].map((line) => (
                        <div key={line} className="rounded-[1rem] border border-white/6 bg-white/[0.02] px-3 py-3 text-sm text-[#d7dde5]">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

function LifecycleSection() {
  return (
    <section className="landing-divider px-6 py-24 sm:py-28">
      <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] lg:items-start">
        <RevealSection id="lifecycle">
          <div className="landing-panel rounded-[2rem] p-4 sm:p-5">
            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/6 pb-4">
                <div>
                  <SectionEyebrow>Execution dashboard</SectionEyebrow>
                  <h3 className="mt-2 text-[1.35rem] text-white">Lifecycle stream for `ISSUE-208`</h3>
                </div>
                <Badge variant="running">running on cloud-runner-us</Badge>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.62fr)_minmax(0,0.38fr)]">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-5">
                    {[
                      ["queued", "done"],
                      ["claimed", "done"],
                      ["running", "live"],
                      ["review", "next"],
                      ["completed", "pending"],
                    ].map(([stage, state], index) => (
                      <div
                        key={stage}
                        className={cn(
                          "rounded-[1.15rem] border px-3 py-4 text-center",
                          index < 2
                            ? "border-[#63d6cb]/26 bg-[#0f1c1f]"
                            : index === 2
                              ? "border-[#63d6cb]/18 bg-white/[0.05]"
                              : "border-white/6 bg-white/[0.025]"
                        )}
                      >
                        <p className="text-xs uppercase tracking-[0.16em] text-[#7c8a98]">{stage}</p>
                        <p className="mt-2 text-sm text-white">{state}</p>
                      </div>
                    ))}
                  </div>

                  <div className="landing-subpanel rounded-[1.4rem] p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white">Run stream</p>
                      <span className="text-xs uppercase tracking-[0.16em] text-[#7c8a98]">last 18 minutes</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {[
                        "Loaded repository context and ranked the retry-policy files.",
                        "Connected the preferred runtime and started the execution session.",
                        "Generated a patch for sync retries and updated diagnostics output.",
                        "Queued focused verification for `sync`, `workers`, and `webhooks`.",
                      ].map((line) => (
                        <div key={line} className="rounded-[1rem] border border-white/6 bg-[#0a0e14] px-4 py-3 text-sm text-[#d7dde5]">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="landing-subpanel rounded-[1.4rem] p-5">
                    <p className="text-sm text-white">Blocker report</p>
                    <div className="mt-4 rounded-[1rem] border border-white/6 bg-white/[0.02] p-4">
                      <p className="text-sm text-white">Waiting on confirmation for one flaky worker assertion</p>
                      <p className="mt-2 text-sm leading-6 text-[#98a6b5]">
                        The agent raised a blocker before declaring failure and left a precise note for the reviewer.
                      </p>
                    </div>
                  </div>

                  <div className="landing-subpanel rounded-[1.4rem] p-5">
                    <p className="text-sm text-white">Live telemetry</p>
                    <div className="mt-4 space-y-4">
                      <MiniBar label="Execution progress" value={64} />
                      <MiniBar label="Verification queued" value={42} tone="muted" />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {[
                        ["Files touched", "9"],
                        ["Tests selected", "14"],
                        ["Elapsed", "18m"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-[1rem] border border-white/6 bg-white/[0.03] px-3 py-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-[#7c8a98]">{label}</p>
                          <p className="mt-2 text-sm text-white">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RevealSection>

        <RevealSection delay={90}>
          <SectionIntro
            eyebrow="Autonomous execution lifecycle"
            title="Autonomous runs still need a visible lifecycle."
            body="A coding agent is more useful when the work can be monitored like any other teammate. Keep claims, execution, blockers, and review state visible while the run is still alive."
          />

          <div className="mt-8 grid gap-4">
            {lifecycleHighlights.map((item, index) => (
              <RevealSection key={item.title} delay={index * 80}>
                <SupportTile {...item} />
              </RevealSection>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

function SkillsSection() {
  return (
    <section className="landing-divider px-6 py-24 sm:py-28">
      <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)] lg:items-center">
        <RevealSection id="skills">
          <SectionIntro
            eyebrow="Reusable skills"
            title="Package a great run into something the next agent can reuse."
            body="Strong execution patterns should not disappear after one issue. Version them, share them, and let future runs start from tested operating knowledge."
          />

          <div className="mt-8 grid gap-4">
            {skillHighlights.map((item, index) => (
              <RevealSection key={item.title} delay={index * 80}>
                <SupportTile {...item} />
              </RevealSection>
            ))}
          </div>
        </RevealSection>

        <RevealSection delay={90}>
          <div className="landing-panel rounded-[2rem] p-4 sm:p-5">
            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/6 pb-4">
                <div>
                  <SectionEyebrow>Skill package</SectionEyebrow>
                  <h3 className="mt-2 text-[1.35rem] text-white">`repo-hardening@1.4.2`</h3>
                </div>
                <Badge variant="primary">stable</Badge>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.62fr)_minmax(0,0.38fr)]">
                <div className="landing-terminal rounded-[1.5rem] p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white">SKILL.md</p>
                    <span className="font-mono-ui text-xs uppercase tracking-[0.16em] text-[#7c8a98]">
                      markdown + config
                    </span>
                  </div>

                  <pre className="mt-5 overflow-x-auto text-sm leading-7 text-[#d7dde5]">
                    <code>{`name: repo-hardening
version: 1.4.2
visibility: workspace
owner: platform/team

goal:
  stabilize retries
  preserve existing defaults
  keep the final diff reviewable

execution:
  runtime: preferred
  blockers: surface early
  verification:
    - pnpm lint
    - pnpm test --filter sync

handoff:
  attach findings to issue
  publish run summary
  flag any flaky suites`}</code>
                  </pre>
                </div>

                <div className="space-y-4">
                  <div className="landing-subpanel rounded-[1.5rem] p-5">
                    <p className="text-sm text-white">Metadata</p>
                    <div className="mt-4 space-y-3 text-sm">
                      {[
                        ["Maintainer", "Platform team"],
                        ["Runs this week", "186"],
                        ["Attached agents", "6"],
                        ["Last update", "2 days ago"],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-4">
                          <span className="text-[#98a6b5]">{label}</span>
                          <span className="text-white">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="landing-subpanel rounded-[1.5rem] p-5">
                    <p className="text-sm text-white">Attached to</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {["Codex Operator", "Deploy Agent", "Review Agent"].map((name) => (
                        <span
                          key={name}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-[#d7dde5]"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="landing-subpanel rounded-[1.5rem] p-5">
                    <p className="text-sm text-white">Recent publish note</p>
                    <p className="mt-3 text-sm leading-7 text-[#98a6b5]">
                      Added runtime fallback rules and narrowed the default verification set for sync-heavy repositories.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

function RuntimeSection() {
  return (
    <section className="landing-divider px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-[1320px]">
        <RevealSection id="runtimes">
          <SectionIntro
            eyebrow="Runtime dashboard"
            title="See every machine, whether it sits under a desk or in the cloud."
            body="Your runtime layer should feel like part of the product, not a hidden dependency. Keep capacity, health, usage, and recent activity visible from one operating surface."
            className="max-w-[42rem]"
          />
        </RevealSection>

        <RevealSection delay={90} className="mt-10">
          <div className="landing-panel rounded-[2rem] p-4 sm:p-5">
            <div className="relative z-10 space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                {runtimeSummary.map(([label, value]) => (
                  <div key={label} className="landing-subpanel rounded-[1.35rem] p-4">
                    <p className="text-[0.72rem] uppercase tracking-[0.2em] text-[#7c8a98]">{label}</p>
                    <p className="mt-3 text-[2rem] leading-none text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,0.54fr)_minmax(0,0.46fr)]">
                <div className="rounded-[1.5rem] border border-white/7 bg-[#0a0f16]/96 p-5">
                  <div className="flex items-center justify-between border-b border-white/6 pb-4">
                    <div>
                      <p className="text-sm text-white">Machine inventory</p>
                      <p className="mt-1 text-sm text-[#7c8a98]">Local and cloud runtimes in one list.</p>
                    </div>
                    <Badge variant="secondary">all runtimes</Badge>
                  </div>

                  <div className="mt-4 space-y-4">
                    {runtimeMachines.map((machine) => (
                      <div key={machine.name} className="landing-subpanel rounded-[1.2rem] p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm text-white">{machine.name}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#7c8a98]">
                              {machine.state}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 text-xs uppercase tracking-[0.16em]",
                              machine.state === "online"
                                ? "bg-[#102021] text-[#63d6cb]"
                                : "bg-white/[0.06] text-[#8e9bab]"
                            )}
                          >
                            {machine.state}
                          </span>
                        </div>

                        <div className="mt-4 space-y-4">
                          <MiniBar label="CPU" value={machine.cpu} tone={machine.state === "online" ? "accent" : "muted"} />
                          <MiniBar
                            label="Memory"
                            value={machine.memory}
                            tone={machine.state === "online" ? "accent" : "muted"}
                          />
                        </div>

                        <div className="mt-4 flex items-center justify-between text-sm">
                          <span className="text-[#98a6b5]">Usage cost</span>
                          <span className="text-white">{machine.cost}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-[minmax(0,0.52fr)_minmax(0,0.48fr)]">
                    <div className="landing-subpanel rounded-[1.5rem] p-5">
                      <p className="text-sm text-white">Usage profile</p>
                      <div className="mt-5 space-y-4">
                        {runtimeUsageBars.map((bar) => (
                          <MiniBar key={bar.label} label={bar.label} value={bar.value} />
                        ))}
                      </div>
                    </div>

                    <div className="landing-subpanel rounded-[1.5rem] p-5">
                      <p className="text-sm text-white">Usage trend</p>
                      <div className="mt-6 flex h-[165px] items-end gap-3">
                        {runtimeTrend.map((value, index) => (
                          <div key={index} className="flex flex-1 flex-col items-center gap-2">
                            <div
                              className="landing-chart-bar w-full rounded-t-full"
                              style={{ height: `${value}%` }}
                            />
                            <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[#7c8a98]">
                              {["M", "T", "W", "T", "F", "S", "S"][index]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="landing-subpanel rounded-[1.5rem] p-5">
                    <p className="text-sm text-white">Recent activity</p>
                    <div className="mt-4 space-y-3">
                      {runtimeActivity.map((line) => (
                        <div key={line} className="rounded-[1rem] border border-white/6 bg-white/[0.02] px-4 py-3 text-sm text-[#d7dde5]">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="landing-divider px-6 py-24 sm:py-28">
      <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:items-start">
        <RevealSection id="how-it-works">
          <SectionIntro
            eyebrow="How it works"
            title="Get from empty workspace to a live autonomous run in four steps."
            body="The setup stays simple: create the shared layer, attach a runtime, define an agent, then assign real work and follow it live."
          />
        </RevealSection>

        <RevealSection delay={80}>
          <div className="relative grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="absolute left-0 right-0 top-8 hidden border-t border-dashed border-white/10 xl:block" />
            {onboardingSteps.map((step) => (
              <article key={step.step} className="landing-subpanel hover-lift relative rounded-[1.6rem] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm text-[#63d6cb]">
                  {step.step}
                </div>
                <h3 className="mt-6 text-lg text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#98a6b5]">{step.body}</p>
              </article>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

function OpenSourceSection() {
  return (
    <section className="landing-divider px-6 py-24 sm:py-28">
      <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-start">
        <RevealSection id="opensource">
          <SectionIntro
            eyebrow="Open source and self-hostable"
            title="Keep the agent layer open, inspectable, and yours to run."
            body="The platform should fit your infrastructure, not the other way around. Self-host it, inspect it, and evolve it without buying into a closed execution model."
          />

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-[#8c9aaa]">
            <span>Source available to inspect</span>
            <span>No managed-runtime requirement</span>
            <span>Fits local and cloud execution</span>
          </div>
        </RevealSection>

        <RevealSection delay={90}>
          <div className="grid gap-4 md:grid-cols-2">
            {openSourcePrinciples.map((item, index) => (
              <RevealSection key={item.title} delay={index * 70}>
                <SupportTile {...item} />
              </RevealSection>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

function FaqSection() {
  const [openIndex, setOpenIndex] = useState(-1);

  return (
    <section className="landing-divider px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[900px]">
        <RevealSection id="faq">
          <div className="mb-12 text-center sm:mb-16">
            <SectionIntro
              eyebrow="FAQ"
              title="Questions before handing work to an agent"
              body="Real operational visibility beats black-box responses. See lifecycle, blockers, and team context at every stage."
            />
          </div>

          <RevealSection delay={60}>
            <div className="landing-panel rounded-[2rem] p-6 sm:p-8">
              <div className="space-y-2">
                {faqItems.map((item, index) => {
                  const isOpen = index === openIndex;

                  return (
                    <div
                      key={item.question}
                      className={cn(
                        "rounded-xl border transition-all duration-300",
                        isOpen
                          ? "border-[#63d6cb]/30 bg-gradient-to-br from-[#0a1419] to-[#0d151a] shadow-lg shadow-[#0a1419]/50"
                          : "border-white/8 bg-white/[0.01] hover:border-white/12 hover:bg-white/[0.02]"
                      )}
                    >
                      <button
                        type="button"
                        className="w-full text-left transition-colors duration-200 hover:disabled:opacity-100"
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${index}`}
                        onClick={() => setOpenIndex(isOpen ? -1 : index)}
                        disabled={false}
                      >
                        <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5">
                          <div className="flex items-start gap-4 min-w-0 flex-1">
                            <span
                              className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-semibold tracking-wide transition-colors duration-200",
                                isOpen
                                  ? "bg-[#63d6cb]/20 text-[#63d6cb]"
                                  : "bg-white/5 text-white/40"
                              )}
                            >
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="min-w-0 text-sm font-medium leading-6 text-white sm:text-base">
                              {item.question}
                            </span>
                          </div>
                          <ChevronDown
                            className={cn(
                              "h-5 w-5 shrink-0 transition-transform duration-300",
                              isOpen ? "text-[#63d6cb] rotate-180" : "text-white/30",
                              "sm:h-6 sm:w-6"
                            )}
                          />
                        </div>
                      </button>

                      <div
                        id={`faq-panel-${index}`}
                        className={cn(
                          "overflow-hidden transition-[max-height,opacity] duration-300 ease-out",
                          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                        )}
                      >
                        <div className="border-t border-white/6 px-5 py-4 sm:px-6 sm:py-5">
                          <div className="ml-10">
                            <p className="text-sm leading-7 text-[#a5b3bf]">{item.answer}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </RevealSection>
        </RevealSection>
      </div>
    </section>
  );
}

function FooterSection() {
  const footerLinks = [
    { href: "/#platform", label: "Platform" },
    { href: "/#lifecycle", label: "Lifecycle" },
    { href: "/#skills", label: "Skills" },
    { href: "/#runtimes", label: "Runtimes" },
    { href: "/#opensource", label: "Open Source" },
  ];

  return (
    <footer className="landing-divider px-6 py-12 sm:py-14">
      <div className="mx-auto max-w-[1320px]">
        <RevealSection>
          <div className="landing-panel rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10">
            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-[34rem]">
                <SectionEyebrow>Start with a real issue</SectionEyebrow>
                <h2 className="font-display mt-4 text-balance text-[2.6rem] leading-[0.94] text-white sm:text-[3.2rem]">
                  Build an agent workforce that stays visible to the whole team.
                </h2>
                <p className="mt-5 text-base leading-8 text-[#98a6b5]">
                  Keep the queue, the runtimes, and the execution trail in one place, then run it on infrastructure you control.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/board" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
                  Open live board
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/onboarding" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                  Start onboarding
                </Link>
              </div>
            </div>
          </div>
        </RevealSection>

        <RevealSection delay={90} className="mt-8">
          <div className="flex flex-col gap-8 border-t border-white/8 pt-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] border border-white/10 bg-white/[0.04] text-sm font-semibold tracking-[0.2em] text-[#63d6cb]">
                  CF
                </div>
                <div>
                  <p className="font-display text-xl text-white">{siteConfig.name}</p>
                  <p className="text-sm text-[#8e9bab]">
                    Shared issue assignment, execution visibility, and runtime control for coding agents.
                  </p>
                </div>
              </div>

              <p className="mt-5 text-xs uppercase tracking-[0.2em] text-[#6f7d8a]">
                Open source. Self-hostable. Built for teams shipping with agents.
              </p>
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
              <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-[#a6b2be]">
                {footerLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                ))}
              </div>

              <a
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#a6b2be] transition-colors hover:text-white"
              >
                GitHub
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 text-sm text-[#72808e] sm:flex-row sm:items-center sm:justify-between">
            <p>{siteConfig.name} keeps the control plane close to the code, the team, and the runtime layer.</p>
            <p>© {new Date().getFullYear()} {siteConfig.name}. No vendor lock-in by default.</p>
          </div>
        </RevealSection>
      </div>
    </footer>
  );
}

export default function LandingPageClient() {
  return (
    <main className="landing-page">
      <div className="landing-shell">
        <HeroSection />
        <AssignSection />
        <LifecycleSection />
        <SkillsSection />
        <RuntimeSection />
        <HowItWorksSection />
        <OpenSourceSection />
        <FaqSection />
        <FooterSection />
      </div>
    </main>
  );
}
