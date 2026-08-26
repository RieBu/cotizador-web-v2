"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/format";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-lg bg-zinc-900/30 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
          transition={{ type: "spring", stiffness: 400, damping: 34 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-3">{children}</span>
    </Link>
  );
}
