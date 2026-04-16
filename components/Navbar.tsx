'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Zap } from "lucide-react";
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
      <nav className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex min-w-0 items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-shadow group-hover:shadow-violet-500/40">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">CodexFlow</p>
                <p className="text-[11px] text-gray-500">AI execution pipeline</p>
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
                      "rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-violet-50 text-violet-700"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
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
            className="gap-2 bg-violet-600 text-white shadow-lg shadow-violet-500/25 hover:bg-violet-700 hover:shadow-violet-500/40 transition-all duration-200"
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
