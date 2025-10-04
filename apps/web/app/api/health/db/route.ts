import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ db: "ok" }, { status: 200 });
  } catch (e) {
    console.error("[/api/health/db] error", e);
    return NextResponse.json({ db: "down" }, { status: 500 });
  }
}
