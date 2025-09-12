// 📄 apps/web/app/components/ClientLayout.tsx

//<main style={{ marginLeft: mostrarSidebar ? 220 : 0, padding: '2rem' }}>
//        {children}
//      </main>
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
  const rutasSinSidebar = ["/login", "/register", "/reset-password"];
  const esLogin = pathname === "/login";

  const mostrarSidebar = !rutasSinSidebar.includes(pathname);

  return (
    <>
      {mostrarSidebar && <Sidebar />}
      <main
        style={{
          marginLeft: mostrarSidebar && !esLogin ? 220 : 0,
          padding: !esLogin ? "2rem" : 0,
        }}
      >
        <PermisosProvider>{children}</PermisosProvider>
      </main>
    </>
  );
}
