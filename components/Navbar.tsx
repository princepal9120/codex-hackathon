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

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-[#e8e0d4] bg-[rgba(249,246,241,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex min-w-0 items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#191713] text-sm font-semibold tracking-[0.16em] text-[#fcfaf6]">
                CF
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1f1c17]">CodexFlow</p>
                <p className="text-xs text-[#7b7368]">Review-first AI execution</p>
              </div>
            </Link>

            <div className="hidden items-center gap-2 md:flex">
              {links.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-full px-3 py-2 text-sm transition-colors",
                      isActive ? "bg-white text-[#1f1c17] shadow-[0_6px_16px_rgba(31,24,18,0.06)]" : "text-[#72695d] hover:bg-white/70 hover:text-[#1f1c17]"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <Button size="sm" className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </nav>
      <CreateTaskModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
    </>
  );
}
