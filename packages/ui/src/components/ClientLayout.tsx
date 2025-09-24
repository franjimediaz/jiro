"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import React from "react";
import { PermisosProvider } from "../lib/permisos";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Rutas donde NO mostramos sidebar
  const rutasSinSidebar = ["/login", "/register", "/reset-password"];
  const esLogin = pathname === "/login";
  const mostrarSidebar = !rutasSinSidebar.includes(pathname);

  return (
    <PermisosProvider>
      {mostrarSidebar && <Sidebar />}

      <main
        style={{
          // Si hay sidebar, dejamos margen; si no, a 0
          marginLeft: mostrarSidebar && !esLogin ? 220 : 0,
          // En login quitamos padding
          padding: !esLogin ? "2rem" : 0,
        }}
      >
        {children}
      </main>
    </PermisosProvider>
  );
}
