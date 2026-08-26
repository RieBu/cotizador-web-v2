import Image from "next/image";
import { redirect } from "next/navigation";
import { Calculator, History, Users, Table2, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/auth";
import { NavLink } from "@/components/nav-link";
import { cerrarSesion } from "./actions";
import { Reveal } from "@/components/motion";

const nav = [
  { href: "/", label: "Cotizador", icon: Calculator },
  { href: "/historial", label: "Historial", icon: History },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/tarifas", label: "Tarifas", icon: Table2 },
];

const navAdmin = [{ href: "/usuarios", label: "Usuarios", icon: ShieldCheck }];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");

  const initials = (user.nombre || user.email)
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen">
      <aside className="relative flex w-64 shrink-0 flex-col overflow-hidden bg-[#b30009] text-white">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#d21a1f] via-[#b30009] to-[#7a0006]" />
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-white/15 blur-3xl" />

        <div className="relative flex items-center gap-3 border-b border-white/15 px-5 py-5">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-lg ring-1 ring-zinc-400/40">
            <Image src="/logo.png" alt="JyS" width={64} height={64} className="object-contain" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold leading-tight">Cotizador JyS</p>
            <p className="text-[11px] text-white/70">Panel de cotizaciones</p>
          </div>
        </div>

        <nav className="relative flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => (
            <NavLink key={item.href} href={item.href}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
          {user.rol === "ADMIN" &&
            navAdmin.map((item) => (
              <NavLink key={item.href} href={item.href}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
        </nav>

        <div className="relative border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-[11px] font-bold">
              {initials || "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white">{user.nombre || user.email}</p>
              <p className="text-[10px] uppercase tracking-wide text-white/45">{user.rol}</p>
            </div>
          </div>
          <form action={cerrarSesion}>
            <button className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/12 hover:text-white">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <Reveal key={user.email}> {children} </Reveal>
      </main>
    </div>
  );
}
