// Rate limiter simple en memoria (ventana deslizante por IP).
// Nota: en Vercel serverless cada instancia tiene su propia memoria, por lo que
// el límite es por-instancia. Para tráfico bajo es suficiente; para escalar a
// múltiples instancias convendría un store compartido (Redis/tabla en BD).

const WINDOW_MS = 60_000; // ventana 1 min
const MAX_POR_VENTANA = 10; // intentos por minuto

const hits = new Map<string, number[]>();

function ip(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "127.0.0.1";
}

export function limitar(req: Request): { ok: boolean; remaining: number } {
  const key = `auth:${ip(req)}`;
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_POR_VENTANA) {
    hits.set(key, arr);
    return { ok: false, remaining: 0 };
  }
  arr.push(now);
  hits.set(key, arr);
  return { ok: true, remaining: MAX_POR_VENTANA - arr.length };
}
