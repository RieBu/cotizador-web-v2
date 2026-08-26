"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Reveal } from "@/components/motion";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [hasUsers, setHasUsers] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((d) => {
        setHasUsers(!!d.hasUsers);
        if (!d.hasUsers) setMode("signup");
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nombre }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Error al procesar la solicitud");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative grid min-h-screen lg:grid-cols-2">
      {/* Panel de marca */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#d21a1f] via-[#b30009] to-[#7a0006] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-white/15 blur-[100px]" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-zinc-900/20 blur-[90px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:36px_36px]" />

        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 shadow-xl ring-1 ring-white/30">
            <Image src="/logo.png" alt="JyS" width={80} height={80} className="object-contain" />
          </div>
        </div>

        <div className="relative max-w-md">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/80"
          >
            Contabilidad &amp; tributación
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-display text-4xl font-semibold leading-tight tracking-tight"
          >
            Cotizaciones que se escriben con la misma precisión que tu contabilidad.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-4 text-white/70"
          >
            Arma cotizaciones con el tarifario real de JyS y entrégalas con la plantilla oficial.
          </motion.p>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} JyS.</p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Reveal>
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-1 shadow-md">
                <Image src="/logo.png" alt="JyS" width={64} height={64} className="object-contain" />
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold leading-tight">Cotizador JyS</h1>
                <p className="text-sm text-muted">Sistema de cotizaciones contables</p>
              </div>
            </div>

            <Card className="p-6 shadow-md">
              <CardContent className="px-0 py-0">
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
                </h2>
                <p className="mb-6 mt-1 text-sm text-muted">
                  {mode === "login"
                    ? "Accede con tu correo corporativo"
                    : hasUsers
                      ? "El registro está cerrado. Pide a un administrador que cree tu cuenta."
                      : "No hay usuarios. Crea el primer administrador."}
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <AnimatePresence initial={false}>
                    {mode === "signup" && (
                      <motion.div
                        key="nombre"
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <Field label="Nombre">
                          <Input
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Nombre completo"
                            required
                          />
                        </Field>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Field label="Email">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@jys.com"
                      autoComplete="email"
                      required
                    />
                  </Field>
                  <Field label="Contraseña">
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      required
                    />
                  </Field>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                    >
                      {error}
                    </motion.p>
                  )}
                  {info && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                    >
                      {info}
                    </motion.p>
                  )}

                  <Button type="submit" disabled={loading} className="h-11 w-full text-base">
                    {loading ? "Procesando…" : mode === "login" ? "Ingresar" : "Crear cuenta"}
                  </Button>
                </form>

                {!hasUsers && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === "login" ? "signup" : "login");
                      setError("");
                      setInfo("");
                    }}
                    className="mt-5 w-full text-center text-sm font-medium text-primary hover:text-primary-strong hover:underline"
                  >
                    {mode === "login" ? "Crear primer administrador" : "Ya tengo cuenta. Iniciar sesión"}
                  </button>
                )}
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
