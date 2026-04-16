'use client';

import { type ReactNode } from "react";
import Sidebar from "@/components/Sidebar";

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
