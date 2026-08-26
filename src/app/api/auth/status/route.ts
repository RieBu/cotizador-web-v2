import { NextResponse } from "next/server";
import { hayUsuarios } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ hasUsers: await hayUsuarios() });
}
