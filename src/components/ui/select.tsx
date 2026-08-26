"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "@/lib/format";

export interface SelectOption {
  label: string;
  value: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Seleccionar…",
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(-1);

  const selected = options.find((o) => o.value === value) ?? null;
  const menuId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function select(o: SelectOption) {
    onChange(o.value);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(options.findIndex((o) => o.value === value));
      } else if (e.key === "ArrowDown") {
        setActive((a) => Math.min(options.length - 1, a + 1));
      } else if (e.key === "Enter" && active >= 0 && options[active]) {
        select(options[active]);
      }
    }
    if (open && e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(options.length - 1, a + 1));
    }
    if (open && e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-50",
          selected ? "text-foreground" : "text-muted-2",
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="ml-2 shrink-0">
          <ChevronDown className="h-4 w-4 text-muted-2" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            role="listbox"
            initial={reduce ? false : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute left-0 right-0 z-50 mt-1.5 max-h-72 origin-top overflow-auto rounded-lg border border-border bg-surface p-1 shadow-lg"
            style={{ transformOrigin: "top" }}
          >
            <div ref={listRef}>
              {options.map((o, i) => {
                const isSel = o.value === value;
                const isActive = i === active;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => select(o)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                      isActive ? "bg-zinc-100 text-zinc-800" : "text-foreground",
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                    {isSel && <Check className="h-4 w-4 shrink-0 text-zinc-700" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
