"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import FormularioTabla from "../../../components/FormularioTabla";
import { RequirePermiso } from "../../../lib/permisos";

/*
model Modulo {
  id       Int      @id @default(autoincrement())
  nombre   String
  icono    String?
  ruta     String?
  orden    Int?
  padreId  Int?
  padre    Modulo?  @relation("ModuloJerarquia", fields: [padreId], references: [id])
  hijos    Modulo[] @relation("ModuloJerarquia")
  activo   Boolean?
}
*/

const secciones = [
  {
    titulo: "Identificación",
    descripcion: "",
    expandible: true,
    expandidaPorDefecto: true,
    campos: [
      {
        nombre: "padreId",
        etiqueta: "Padre",
        readOnly: true,
        tipo: "selectorTabla",
        tabla: "modulos",
        campoLabel: "nombre",
        campoValue: "id",
      },
      { nombre: "ruta", etiqueta: "Ruta", tipo: "text", readOnly: true },
      { nombre: "orden", etiqueta: "Orden", tipo: "number", readOnly: true },
      { nombre: "nombre", etiqueta: "Nombre del Módulo", tipo: "text" },
      { nombre: "icono", etiqueta: "Icono", tipo: "icono" },
      { nombre: "activo", etiqueta: "Activo", tipo: "checkbox" },
    ],
  },
];

export default function VerEditarModulo() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const modoEdicion = searchParams.get("edit") === "true";

  const [valores, setValores] = useState<{
    nombre: string;
    ruta: string;
    icono: string;
    orden: string | number | null;
    padreId: string | number | null;
    activo: boolean;
    // Visual only (no backend mapping here)
  }>({
    nombre: "",
    ruta: "",
    icono: "",
    orden: "",
    padreId: "",
    activo: true,
  });

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!id) {
      setCargando(false);
      return;
    }

    let cancelado = false;

    const cargarModulo = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/modulos/${id}`,
          {
            credentials: "include",
          }
        );

        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (res.status === 403) {
          router.replace("/403");
          return;
        }

        if (!res.ok) {
          console.error("Error al obtener módulo:", res.status);
          router.push("/system/modulos");
          return;
        }

        const data = await res.json();

        if (!cancelado) {
          setValores({
            nombre: data?.nombre ?? "",
            ruta: data?.ruta ?? "",
            icono: data?.icono ?? "",
            orden:
              typeof data?.orden === "number"
                ? data.orden
                : (data?.orden ?? ""),
            padreId:
              typeof data?.padreId === "number"
                ? data.padreId
                : (data?.padreId ?? ""),
            activo: data?.activo ?? true,
          });
          setCargando(false);
        }
      } catch (err) {
        console.error("Error al obtener Módulo:", err);
        router.push("/system/modulos");
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargarModulo();
    return () => {
      cancelado = true;
    };
  }, [id, router]);

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    try {
      setGuardando(true);

      const payload = {
        nombre: valores.nombre,
        ruta: valores.ruta || null,
        icono: valores.icono || null,
        orden:
          valores.orden === "" || valores.orden === null
            ? null
            : Number(valores.orden),
        padreId:
          valores.padreId === "" || valores.padreId === null
            ? null
            : Number(valores.padreId),
        activo: Boolean(valores.activo),
        // Nota: los flags de "permisos" son visuales aquí y no se envían.
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/modulos/${id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/403");
        return;
      }

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error || "Error al actualizar");
      }

      alert("Módulo actualizado correctamente");
      router.push("/system/modulos");
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Error de conexión al actualizar"
      );
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <p>Cargando Módulo...</p>;

  const accionNecesaria = modoEdicion ? "editar" : "ver";

  return (
    <RequirePermiso modulo="modulos" accion={accionNecesaria} fallback={null}>
      <FormularioTabla
        titulo={modoEdicion ? "Editar Módulo" : "Detalle del Módulo"}
        secciones={secciones}
        valores={valores}
        onChange={modoEdicion ? handleChange : undefined}
        onSubmit={modoEdicion && !guardando ? handleSubmit : undefined}
        botonTexto={
          modoEdicion
            ? guardando
              ? "Guardando..."
              : "Guardar cambios"
            : undefined
        }
        soloLectura={!modoEdicion}
      />
    </RequirePermiso>
  );
}
