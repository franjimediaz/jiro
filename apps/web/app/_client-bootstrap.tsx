"use client";

import { useEffect, useRef } from "react";

export default function ClientBootstrap() {
  const patchedRef = useRef(false);

  useEffect(() => {
    if (patchedRef.current) return;
    patchedRef.current = true;

    try {
      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
      if (!API_BASE || typeof window === "undefined") return;

      const originalFetch = window.fetch.bind(window);
      window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
        try {
          const url =
            typeof input === "string"
              ? input
              : input instanceof URL
                ? input.toString()
                : input.url;

          const isApi = API_BASE && url.startsWith(API_BASE);

          // Permite saltarse el parche puntualmente:
          // fetch(url, { headers: { 'X-No-Credentials': '1' } })
          const noCreds =
            !!init?.headers &&
            (init.headers as Record<string, string>)["X-No-Credentials"] ===
              "1";

          if (isApi && !noCreds) {
            init = {
              ...(init || {}),
              credentials: init?.credentials ?? "include",
            };
          }
        } catch {
          // ignorar
        }
        return originalFetch(input as any, init as any);
      };

      // eslint-disable-next-line no-console
      console.log("🔧 fetch parcheado para API_BASE:", API_BASE);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("No se pudo parchear fetch:", e);
    }
  }, []);

  return null;
}
