import * as React from "react";
export const dynamic = "force-dynamic";
export const revalidate = 0;
const SuspenseAny =
  React.Suspense as unknown as React.ComponentType<
    React.PropsWithChildren<{ fallback?: React.ReactNode }>
  >;
export default function Layout(props: any) {
  const { children } = (props ?? {}) as { children?: React.ReactNode };
  return <SuspenseAny fallback={<div>Cargando tareas…</div>}>{children}</SuspenseAny>;
}
