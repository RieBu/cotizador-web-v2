"use client";

import { useEffect, useRef, useState } from "react";
import { Printer, X } from "lucide-react";
import { renderAsync } from "docx-preview";
import { Button } from "@/components/ui/button";

export function DocxPreview({
  open,
  blob,
  onClose,
}: {
  open: boolean;
  blob: Blob | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open || !blob || !ref.current) return;
    setLoading(true);
    setErr("");
    ref.current.innerHTML = "";
    renderAsync(blob as unknown as ArrayBuffer, ref.current, undefined, {
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
    })
      .catch((e) => setErr(e instanceof Error ? e.message : "No se pudo renderizar"))
      .finally(() => setLoading(false));
  }, [open, blob]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-900/60 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/10 bg-surface px-4 py-3">
        <h3 className="font-display text-base font-semibold">Vista previa · Plantilla oficial</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Imprimir / PDF
          </Button>
          <Button variant="ghost" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {loading && <p className="text-center text-sm text-muted">Cargando documento…</p>}
        {err && <p className="text-center text-sm text-red-600">{err}</p>}
        <div className="mx-auto max-w-4xl rounded-xl bg-white p-4 shadow-md">
          <div ref={ref} className="docx-preview" />
        </div>
      </div>
    </div>
  );
}
