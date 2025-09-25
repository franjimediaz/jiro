"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

type PermisosMapa = Record<string, Record<string, boolean>>;

type PermisosState = {
  loading: boolean;
  permisos: PermisosMapa | null;
  usuario?: { id: number; nombre?: string; rol?: string } | null;
  can: (modulo: string, accion?: string) => boolean;
  reload: () => void;
};

const Ctx = createContext<PermisosState | null>(null);
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export default function PermisosProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [permisos, setPermisos] = useState<PermisosMapa | null>(null);
  const [usuario, setUsuario] = useState<{
    id: number;
    nombre?: string;
    rol?: string;
  } | null>(null);
  const pathname = usePathname();

  const cargar = async () => {
    try {
      // Evita pedir permisos en páginas públicas
      if (pathname?.startsWith("/login") || pathname?.startsWith("/403")) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/me/permissions`, {
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 401) {
        if (typeof window !== "undefined") window.location.href = "/login";
        return;
      }

      // Nota: si el backend devolviera 403 aquí (no debería), NO redirigimos:
      // cada página decide con <RequirePermiso/>.

      const data = await res.json().catch(() => ({}));
      setPermisos(data?.permisos ?? {});
      setUsuario(data?.usuario ?? null);
    } catch (e) {
      console.warn("No se pudieron cargar permisos:", e);
      setPermisos({});
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const can = useMemo(
    () =>
      (modulo: string, accion = "ver") =>
        !!permisos?.[modulo]?.[accion],
    [permisos]
  );

  const value = useMemo(
    () => ({ loading, permisos, usuario, can, reload: cargar }),
    [loading, permisos, usuario]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePermisos() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("usePermisos debe usarse dentro de <PermisosProvider>");
  return ctx;
}

/** Redirige a /403 si NO tiene permiso {modulo, accion}. */
export function RequirePermiso({
  modulo,
  accion = "ver",
  fallback = null,
  children,
}: {
  modulo: string;
  accion?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { loading, can } = usePermisos();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !can(modulo, accion)) {
      router.replace("/403");
    }
  }, [loading, modulo, accion, can, router]);

  if (loading) return null; // puedes poner aquí un skeleton/spinner
  if (!can(modulo, accion)) return <>{fallback}</>;
  return <>{children}</>;
}
