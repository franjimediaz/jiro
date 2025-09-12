import MiPerfilClient from "./MiPerfilClient";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getPerfil() {
  const res = await fetch(`/api/me`, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar el perfil");
  return res.json();
}

export default async function Page() {
  const perfil = await getPerfil();
  return <MiPerfilClient perfilInicial={perfil} />;
}
