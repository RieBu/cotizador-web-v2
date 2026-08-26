import * as React from "react";
import { cn } from "@/lib/format";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-sm hover:bg-primary-strong active:bg-primary-strong focus-visible:ring-primary/40",
  secondary:
    "bg-plomo text-white shadow-sm hover:bg-zinc-600 focus-visible:ring-zinc-500/40",
  outline:
    "border border-border bg-surface text-foreground shadow-sm hover:bg-surface-soft focus-visible:ring-plomo/30",
  ghost: "text-muted hover:bg-zinc-100 hover:text-zinc-800 focus-visible:ring-zinc-400/40",
  destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500/40",
};

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
        variants[variant],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
