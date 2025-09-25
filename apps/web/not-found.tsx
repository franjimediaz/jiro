// apps/web/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Página no encontrada</h1>
      <p style={{ marginBottom: 16 }}>
        La ruta que buscas no existe o ha cambiado.
      </p>
      <Link href="/">Volver al inicio</Link>
    </main>
  );
}
