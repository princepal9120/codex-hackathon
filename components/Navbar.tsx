'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useState } from "react";

import CreateTaskModal from "@/components/CreateTaskModal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Overview" },
  { href: "/board", label: "Board" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (pathname.startsWith("/board")) {
    return null;
  }

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex min-w-0 items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-md transition-shadow">
                CF
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">CodexFlow</p>
                <p className="text-[11px] text-muted-foreground">AI execution pipeline</p>
              </div>
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {links.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-[var(--radius)] px-3 py-1.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <Button
            size="sm"
            className="gap-2"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </nav>
      <CreateTaskModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
    </>
  );
}
