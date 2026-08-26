"use client";

import * as React from "react";
import { cn } from "@/lib/format";

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-sm transition-all",
        checked ? "border-plomo bg-zinc-100 text-zinc-800" : "text-muted hover:border-plomo/40 hover:text-foreground",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="h-4 w-4 accent-zinc-700"
      />
      <span>{label}</span>
    </label>
  );
}
