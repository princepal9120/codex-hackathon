"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/Button";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/#platform", label: "Platform" },
  { href: "/#lifecycle", label: "Lifecycle" },
  { href: "/#skills", label: "Skills" },
  { href: "/#runtimes", label: "Runtimes" },
  { href: "/#opensource", label: "Open Source" },
];

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-white/8 bg-[#070b11]/84 shadow-[0_16px_50px_rgba(0,0,0,0.34)] backdrop-blur-2xl"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[1.1rem] border border-white/10 bg-white/[0.04] text-sm font-semibold tracking-[0.2em] text-[#63d6cb]">
            CF
          </div>
          <div>
            <p className="font-display text-xl text-white">{siteConfig.name}</p>
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[#788593]">agent workforce</p>
          </div>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm text-[#a9b5c2] transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1 text-sm text-[#a9b5c2] transition-colors hover:text-white sm:inline-flex"
          >
            GitHub
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>

          <Link href="/board" className={cn(buttonVariants({ size: "sm" }), "min-w-[120px]")}>
            Open board
          </Link>
        </div>
      </div>
    </nav>
  );
}
