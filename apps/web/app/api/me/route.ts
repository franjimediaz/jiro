import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const token = cookies().get("token")?.value;
    if (!token) return NextResponse.json({ auth: false }, { status: 401 });

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "cambia-esto-en-vercel"
    ) as { id: number; rolId?: number; rolNombre?: string };

    return NextResponse.json({ auth: true, user: payload }, { status: 200 });
  } catch {
    return NextResponse.json({ auth: false }, { status: 401 });
  }
}
