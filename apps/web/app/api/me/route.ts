import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

export async function GET() {
  try {
    // ✅ Obtener cookies para autenticación
    const headersList = await headers();
    const cookieHeader = headersList.get("cookie") || "";

    console.log("🔍 GET /api/me - Cookies:", cookieHeader);

    const r = await fetch(`${API_URL}/directorio/me`, {
      method: "GET",
      credentials: "include",
      headers: {
        cookie: cookieHeader,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    console.log("📥 Backend response status:", r.status);

    const body = await r.text();
    return new NextResponse(body, {
      status: r.status,
      headers: {
        "Content-Type": r.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    console.error("❌ Error en GET /api/me:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // ✅ Obtener cookies para autenticación
    const headersList = await headers();
    const cookieHeader = headersList.get("cookie") || "";
    const payload = await req.json();

    console.log("🔍 PATCH /api/me - Cookies:", cookieHeader);
    console.log("📦 PATCH /api/me - Payload:", payload);

    const r = await fetch(`${API_URL}/directorio/me`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieHeader,
      },
      body: JSON.stringify(payload),
    });

    console.log("📥 Backend PATCH response status:", r.status);

    const body = await r.text();
    return new NextResponse(body, {
      status: r.status,
      headers: {
        "Content-Type": r.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    console.error("❌ Error en PATCH /api/me:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
