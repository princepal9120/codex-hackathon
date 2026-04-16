import type { ReactNode } from "react";
import type { Metadata } from "next";

import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodexFlow — AI Task Execution Pipeline",
  description:
    "Turn coding tasks into verifiable execution pipelines. Rank repo context, preview prompts, capture diffs, and verify with lint and tests before trusting the result.",
  keywords: ["AI coding", "code execution", "task pipeline", "code review", "verification"],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
