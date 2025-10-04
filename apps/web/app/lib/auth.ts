import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export function getUserFromCookie() {
  const token = cookies().get("token")?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "cambia-esto-en-vercel"
    );
    return payload as { id: number; rolId?: number; rolNombre?: string };
  } catch {
    return null;
  }
}
