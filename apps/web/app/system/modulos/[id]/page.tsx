"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import FormularioTabla from "../../../components/FormularioTabla";

{
  /** model Modulo {
  id          Int       @id @default(autoincrement())
  nombre      String
  icono       String?
  ruta        String?
  orden       Int?
  padreId     Int?                     // Clave foránea
  padre       Modulo?   @relation("ModuloJerarquia", fields: [padreId], references: [id])
  hijos       Modulo[]  @relation("ModuloJerarquia") // Relación inversa
} */
}

const campos = [
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
      { nombre: "orden", etiqueta: "Orden", tipo: "numero", readOnly: true },
      { nombre: "nombre", etiqueta: "Nombre del Modulo", tipo: "text" },
      { nombre: "icono", etiqueta: "Icono", tipo: "icono" },
      { nombre: "activo", etiqueta: "Activo", tipo: "checkbox" },
    ],
  },
  {
    titulo: "Permisos",
    descripcion: "Configuración de permisos para el módulo",
    expandible: true,
    expandidaPorDefecto: true,
    campos: [
      { nombre: "crear", etiqueta: "Crear", tipo: "checkbox" },
      { nombre: "leer", etiqueta: "Leer", tipo: "checkbox" },
      { nombre: "actualizar", etiqueta: "Actualizar", tipo: "checkbox" },
      { nombre: "eliminar", etiqueta: "Eliminar", tipo: "checkbox" },
    ],
  },
];

export default function VerEditarModulo() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const modoEdicion = searchParams.get("edit") === "true";
  const [valores, setValores] = useState({
    nombre: "",
    ruta: "",
    icono: "",
    orden: "",
    padreId: "",
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // ✅ Validar que existe el ID antes de hacer el fetch
    if (!id) {
      setCargando(false);
      return;
    }

    const cargarModulo = async () => {
      try {
        // ✅ Usar la URL correcta de tu API
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/modulos/${id}`,
          {
            credentials: "include",
          }
        );

        if (res.ok) {
          const data = await res.json();
          // ✅ Convertir valores para el formulario
          setValores({
            nombre: data.nombre || "",
            ruta: data.ruta || "",
            icono: data.icono || "",
            orden: data.orden ? data.orden.toString() : "",
            padreId: data.padreId ? data.padreId.toString() : "",
          });
        } else {
          console.error("Error al obtener módulo:", res.status);
          alert("Módulo no encontrado");
          router.push("/system/modulos");
        }
      } catch (err) {
        console.error("Error al obtener Módulo:", err);
        alert("Error de conexión");
        router.push("/system/modulos");
      } finally {
        setCargando(false);
      }
    };

    cargarModulo();
  }, [id, router]); // ✅ Agregar dependencias correctas

  const handleChange = (nombre: string, valor: any) => {
    setValores((prev) => ({ ...prev, [nombre]: valor }));
  };

  const handleSubmit = async () => {
    try {
      // ✅ Preparar datos con tipos correctos
      const datosParaEnviar = {
        nombre: valores.nombre,
        ruta: valores.ruta || null,
        icono: valores.icono || null,
        orden: valores.orden ? Number(valores.orden) : null,
        padreId: valores.padreId ? Number(valores.padreId) : null,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/modulos/${id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datosParaEnviar),
        }
      );

      if (res.ok) {
        alert("Módulo actualizado correctamente");
        router.push("/system/modulos"); // ✅ Ruta correcta
      } else {
        const error = await res.json();
        alert(`Error al actualizar: ${error.error || "Error desconocido"}`);
      }
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("Error de conexión al actualizar");
    }
  };
  if (cargando) return <p>Cargando Modulo...</p>;

  return (
    <>
      <FormularioTabla
        titulo={modoEdicion ? "Editar Modulo" : "Detalle del Modulo"}
        secciones={campos}
        valores={valores}
        onChange={modoEdicion ? handleChange : undefined}
        onSubmit={modoEdicion ? handleSubmit : undefined}
        botonTexto="Guardar cambios"
        soloLectura={!modoEdicion}
      />
    </>
  );
}
