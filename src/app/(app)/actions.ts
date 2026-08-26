"use server";

import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth";
import { cookies } from "next/headers";

export async function cerrarSesion() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
