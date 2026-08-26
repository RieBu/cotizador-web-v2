# Cotizador JyS Web

Sistema web de cotizaciones contables — migración del programa de escritorio
(Python + PySide6 + SQLite) a una app moderna desplegada en **Vercel** (gratis)
con base de datos en **Neon Postgres** (gratis) y **autenticación propia por cookie JWT**.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript + Tailwind CSS
- **Neon Postgres** (pooled) + cliente `pg` (solo servidor/API routes)
- **Auth**: sesión por cookie JWT (HS256 con `jose`) + `bcryptjs` (primer usuario → ADMIN)
- **PDF**: `@react-pdf/renderer` (se genera en el navegador, sin servidor)
- **Lógica de negocio**: port 1:1 desde `motor_calculo.py` (9 planes)

## Funcionalidades

- Login/registro (el **primer usuario registrado** se vuelve **ADMIN**).
- Asistente de cotización en 3 pasos (Cliente → Plan → Resumen) con vista previa en vivo.
- 9 planes con tarifario 1:1 (221 tarifas): Empresarial 2026, Integral 2026, Integral Externo,
  Régimen Especial, Declaración Express, Registro de Marca, Constitución de Empresa,
  Asociación Pro Vivienda, Asesoría Financiera.
- Descuento en soles (comportamiento real del programa).
- Numeración automática atómica `NNNN-AAAA` (función SQL con advisory lock).
- Generación de PDF con la estructura de las plantillas DOCX.
- Historial de cotizaciones (filtro por plan/búsqueda, reimpresión PDF).
- CRUD de clientes con autocompletado por RUC.
- Pantalla de tarifas editable (solo ADMIN).

## Requisitos

- Node.js 20+ y pnpm 9+
- Una cuenta en [Neon](https://neon.tech) (gratis)
- Una cuenta en [Vercel](https://vercel.com) (gratis)

---

## 1) Configurar Neon

1. Crea un proyecto en [neon.tech](https://neon.tech) (o usa uno existente).
2. Vincula la app con el proyecto (opcional, para usar el CLI):
   ```bash
   npx neon@latest link --agent --org-id <org-id> --project-id <project-id> --branch production
   ```
3. Obtén el **connection string pooled** en Dashboard (SQL → Conecta) y guárdalo como `DATABASE_URL`.
4. Aplica el esquema y el seed de tarifas:
   ```bash
   cp .env.example .env.local   # pega DATABASE_URL y AUTH_SECRET
   node scripts/apply-db.mjs    # ejecuta db/schema.sql + db/seed.sql
   ```
   > El primer usuario registrado en `/login` se vuelve **ADMIN** automáticamente.

### Re-generar el seed de tarifas (si cambias `seed-data.ts`)
```bash
node scripts/generate-seed.mjs   # escribe db/seed.sql
```

---

## 2) Desarrollo local

```bash
pnpm install
cp .env.example .env.local
pnpm dev          # http://localhost:3000
```

### Tests de paridad con el programa legacy

```bash
pnpm test
```

Valida que el motor TypeScript produce los mismos montos que `motor_calculo.py`.

---

## 3) Despliegue en Vercel (gratis)

1. Sube el proyecto a GitHub.
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repo.
3. Añade variables de entorno:
   - `DATABASE_URL` (Neon pooled)
   - `AUTH_SECRET` (secreto JWT)
   - `NEXT_PUBLIC_SITE_URL` = `https://tu-app.vercel.app`
4. **Deploy**. Dominio gratuito `https://tu-app.vercel.app` (o añade tu dominio en Settings → Domains).

---

## 4) Estructura

```
src/
├── app/
│   ├── login/                # login / registro
│   ├── (app)/                # área autenticada (sidebar)
│   │   ├── page.tsx          # cotizador (asistente)
│   │   ├── historial/  clientes/  tarifas/
│   │   └── layout.tsx + actions.ts
│   ├── api/                  # API routes (auth, tarifas, clientes, cotizaciones)
│   ├── layout.tsx
│   └── proxy.ts              # guard de autenticación (verifica cookie JWT)
├── components/
│   ├── cotizador/  pdf/  ui/
└── lib/
    ├── calculos/             # motor de cálculo (port de motor_calculo.py)
    ├── auth.ts               # JWT + bcrypt + login/signup/logout
    ├── db.ts                 # Pool de pg
    ├── datos.ts              # acceso a datos (fetch a /api/*)
    └── generar-pdf.ts        # descarga del PDF

db/
├── schema.sql                # tablas + funciones de numeración + usuarios
└── seed.sql                  # 221 tarifas (generado)

scripts/
├── apply-db.mjs              # aplica schema + seed a Neon
├── generate-seed.mjs         # regenera db/seed.sql
└── run-calc-tests.mjs        # tests de paridad
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Connection string pooled de Neon (solo servidor) |
| `AUTH_SECRET` | Clave de firma de sesiones JWT |
| `NEXT_PUBLIC_SITE_URL` | URL de la app |

## Seguridad

- La credencial de la base de datos vive solo en el servidor (API routes con `pg`).
- Sesiones por cookie httpOnly + firma JWT; `AUTH_SECRET` nunca se expone.
- Roles `ADMIN` / `ASESOR`: escribir tarifas y eliminar clientes/cotizaciones es **solo ADMIN**.
- El primer registro se promueve a ADMIN (mismo comportamiento que el trigger de Supabase anterior).

## Licencia

Privado. © 2026 JyS.
