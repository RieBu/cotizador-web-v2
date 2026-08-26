import * as React from "react";
import { cn } from "@/lib/format";

type BadgeVariant = "default" | "success" | "warning" | "outline" | "accent";

const variants: Record<BadgeVariant, string> = {
  default: "bg-plomo text-white",
  success: "bg-ok-soft text-ok",
  warning: "bg-accent-soft text-accent-strong",
  outline: "border border-border text-muted",
  accent: "bg-primary text-white",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
