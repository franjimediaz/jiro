// apps/web/server/auth/session.ts
import { cookies, headers } from "next/headers";

export type SessionUser = {
  id: number;
  nombre?: string | null;
  rol?: string | null;
};

export async function getUserFromRequest(): Promise<SessionUser | null> {
  // 1) Cookie de sesión (cámbialo a tu nombre real de cookie)
  const cookieStore = await cookies();
  const raw = cookieStore.get("session")?.value;

  // 2) O Authorization: Bearer <jwt> (si lo usas)
  const h = await headers();
  const auth = h.get("authorization");

  // Aquí debes validar tu token/JWT (si lo tienes) o descifrar la cookie.
  // Por ahora, si hay cookie "session", simulamos un usuario #1.
  if (raw) {
    // TODO: sustituir por tu validación real
    return { id: 1, nombre: "Usuario Demo", rol: "admin" };
  }

  if (auth?.startsWith("Bearer ")) {
    // TODO: verifica el JWT y extrae el userId
    const userId = 1; // ← demo
    return { id: userId, nombre: "Usuario Token", rol: "admin" };
  }

  return null;
}
