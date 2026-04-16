'use client';

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  ChevronDown,
  Command,
  FolderKanban,
  Home,
  Monitor,
  Search,
  Settings,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";

import { cn } from "@/lib/utils";

const quickActions = [
  { id: "overview", label: "Overview", icon: Home, href: "/" },
  { id: "search", label: "Search", icon: Search, shortcut: "⌘K" },
];

const workspaceNav = [
  { id: "board", label: "Board", icon: FolderKanban, href: "/board" },
  { id: "projects", label: "Projects", icon: Workflow, href: "/projects" },
];

const configNav = [
  { id: "runtimes", label: "Runtimes", icon: Monitor, href: "/runtimes" },
  { id: "skills", label: "Skills", icon: Sparkles, href: "/skills" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-[260px] lg:flex-col border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
      {/* Brand */}
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-[11px] font-bold text-sidebar-primary-foreground shadow-sm">
            CF
          </div>
          <div>
            <p className="text-[14px] font-semibold text-sidebar-foreground leading-none">CodexFlow</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Execution system</p>
          </div>
        </Link>
        <button type="button" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" aria-label="Command menu">
          <Command className="h-4 w-4" />
        </button>
      </div>

      {/* Quick actions */}
      <nav className="px-3 space-y-0.5">
        {quickActions.map((item) => {
          const content = (
            <>
              <span className="flex items-center gap-2.5">
                <item.icon className="h-4 w-4" />
                {item.label}
              </span>
              {item.shortcut && (
                <kbd className="rounded border border-sidebar-border bg-sidebar px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {item.shortcut}
                </kbd>
              )}
            </>
          );

          return (
            <Link
              key={item.id}
              href={item.href || "#"}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                pathname === item.href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {content}
            </Link>
          );
        })}
      </nav>

      {/* Workspace selector */}
      <div className="mx-3 mt-5 rounded-lg border border-sidebar-border bg-sidebar p-3">
        <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-muted-foreground">Workspace</p>
        <button type="button" className="mt-2 flex w-full items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-foreground">Engineering</p>
            <p className="truncate text-[11px] text-muted-foreground">Repo-aware task ops</p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </div>

      {/* Workspace nav */}
      <SidebarGroup title="Workspace">
        {workspaceNav.map((item) => (
          <SidebarLink key={item.id} href={item.href} icon={<item.icon className="h-4 w-4" />} label={item.label} active={pathname === item.href} />
        ))}
      </SidebarGroup>

      {/* Configure nav */}
      <SidebarGroup title="Configure">
        {configNav.map((item) => (
          <SidebarLink key={item.id} href={item.href} icon={<item.icon className="h-4 w-4" />} label={item.label} active={pathname === item.href} />
        ))}
      </SidebarGroup>

      <div className="flex-1" />
    </aside>
  );
}

function SidebarGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5 px-3">
      <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <nav className="space-y-0.5">{children}</nav>
    </div>
  );
}

function SidebarLink({ href, icon, label, active = false }: { href: string; icon: ReactNode; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
