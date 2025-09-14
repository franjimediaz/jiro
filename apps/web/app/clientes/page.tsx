"use client";

import { useEffect, useState } from "react";
import TablaListado from "../components/TablaListado";
import styles from "./clientes.module.css";
import { useRouter } from "next/navigation";
import { RequirePermiso, usePermisos } from "../lib/permisos";

type Clientes = {
  id: number;
  nombre: string;
  apellido: string;
  direccion: string;
  email: string;
  telefono: string;
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Clientes[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ⬇️ permisos del usuario
  const { loading: permisosLoading, can } = usePermisos();

  // ⬇️ Traer datos SOLO si tiene permiso de 'ver'
  useEffect(() => {
    if (permisosLoading) return;

    if (!can("clientes", "ver")) {
      setClientes([]);
      setLoading(false);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/clientes`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Respuesta del backend:", data);
        if (Array.isArray(data)) {
          setClientes(data);
        } else if (Array.isArray((data as any)?.clientes)) {
          setClientes((data as any).clientes);
        } else {
          console.error("Los datos no son un array:", data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener clientes:", err);
        setLoading(false);
      });
  }, [permisosLoading, can]);

  const handleEliminar = (cliente: Clientes) => {
    if (!can("clientes", "eliminar")) {
      alert("Sin permiso para eliminar");
      return;
    }

    if (confirm(`¿Eliminar cliente "${cliente.nombre}"?`)) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/clientes/${cliente.id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then(() => {
          setClientes((prev) => prev.filter((o) => o.id !== cliente.id));
          alert("Cliente eliminado");
        })
        .catch(() => alert("Error al eliminar"));
    }
  };

  const columnas = [
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "direccion", encabezado: "Dirección" },
    { clave: "email", encabezado: "Email" },
  ];

  const exportC = [
    { clave: "id", encabezado: "ID" },
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "apellido", encabezado: "Apellido" },
    { clave: "email", encabezado: "Email" },
    { clave: "dni", encabezado: "DNI" },
    { clave: "direccion", encabezado: "Dirección" },
    { clave: "telefono", encabezado: "Teléfono" },
  ];

  // Solo habilitamos exportar si tiene permiso
  const exportColumns = can("clientes", "exportar") ? exportC : [];

  // En tu definición de módulos, "clientes" NO tiene "importar".
  // Si tu TablaListado soporta un boolean, lo atamos a can("clientes","importar") (será false) o directamente false.
  const puedeImportar = can("clientes", "importar"); // normalmente false

  return (
    <RequirePermiso modulo="clientes" accion="ver">
      <main>
        <div className={styles.clientesContainer}>
          <div className={styles.header}>
            <h1>Listado de clientes</h1>

            {/* Botón crear solo con permiso */}
            {can("clientes", "crear") && (
              <button
                className={styles.botonCrear}
                onClick={() => router.push("/clientes/create")}
              >
                + Crear cliente
              </button>
            )}
          </div>

          {loading ? (
            <p>Cargando clientes...</p>
          ) : (
            <TablaListado
              titulo=""
              columnas={columnas}
              datos={clientes}
              onVer={(c) =>
                can("clientes", "ver") && router.push(`/clientes/${c.id}`)
              }
              onEditar={(c) =>
                can("clientes", "editar") &&
                router.push(`/clientes/${c.id}?edit=true`)
              }
              onEliminar={handleEliminar}
              registrosPorPagina={10}
              exportC={exportColumns}
              mostrarImportar={puedeImportar}
              importUrl={`${process.env.NEXT_PUBLIC_API_URL}/clientes`}
              onImport={async () => {
                if (!puedeImportar) return;
                const res = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/clientes`,
                  {
                    credentials: "include",
                  }
                );
                const nuevosDatos = await res.json();
                if (Array.isArray(nuevosDatos)) {
                  setClientes(nuevosDatos);
                }
              }}
            />
          )}
        </div>
      </main>
    </RequirePermiso>
  );
}
