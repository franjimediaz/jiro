"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TablaFractal } from "@repo/ui";
import { obtenerModulosJerarquicos } from "./modulosService";
import BotonInicializarModulos from "./utils/BotonInicializarModulos";
import { RequirePermiso, usePermisos } from "../../lib/permisos";

type Modulo = {
  id: number;
  nombre: string;
  ruta?: string | null;
  orden?: number | null;
  icono?: string | null;
  padreId?: number | null;
  hijos?: Modulo[];
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const PageModulos = () => {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [usandoFallback, setUsandoFallback] = useState(false);
  const router = useRouter();
  const { can } = usePermisos();

  useEffect(() => {
    const cargarModulos = async () => {
      setCargando(true);
      setUsandoFallback(false);

      try {
        // 1) Intentar cargar desde la base de datos
        const response = await fetch(`${API_BASE}/modulos`, {
          credentials: "include",
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        if (response.status === 403) {
          // No forzamos /403 aquí para no romper la UX de RequirePermiso, pero si quieres:
          router.replace("/403");
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const modulosDB: Modulo[] = await response.json();

        if (Array.isArray(modulosDB) && modulosDB.length > 0) {
          const modulosJerarquicos = construirJerarquia(modulosDB);
          setModulos(modulosJerarquicos);
        } else {
          // Si la DB está vacía, lanzamos para ir a fallback
          throw new Error("No hay módulos en la base de datos");
        }
      } catch (error) {
        // 2) Fallback a datos por defecto (obtenerModulosJerarquicos)
        try {
          const modulosPorDefecto = await obtenerModulosJerarquicos();
          setModulos(modulosPorDefecto as Modulo[]);
          setUsandoFallback(true);
        } catch (fallbackError) {
          console.error("Error en fallback:", fallbackError);
          setModulos([]);
        }
      } finally {
        setCargando(false);
      }
    };

    cargarModulos();
  }, [router]);

  const construirJerarquia = (modulosPlanos: Modulo[]): Modulo[] => {
    const mapa = new Map<number, Modulo>();
    const raices: Modulo[] = [];

    // ✅ ASEGURAR que todos los módulos tengan hijos inicializados
    modulosPlanos.forEach((m) => {
      mapa.set(m.id, {
        ...m,
        hijos: m.hijos || [], // ✅ Garantizar array vacío si es undefined
      });
    });

    mapa.forEach((mod) => {
      if (mod.padreId) {
        const padre = mapa.get(mod.padreId);
        if (padre) {
          // ✅ ASEGURAR que padre.hijos existe antes de push
          if (!padre.hijos) padre.hijos = [];
          padre.hijos.push(mod);
        } else {
          raices.push(mod);
        }
      } else {
        raices.push(mod);
      }
    });

    // ✅ FUNCIÓN RECURSIVA con verificación de hijos
    const ordenarRec = (nodos: Modulo[]) => {
      nodos.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
      nodos.forEach((n) => {
        if (n.hijos && n.hijos.length > 0) {
          ordenarRec(n.hijos);
        }
      });
    };
    ordenarRec(raices);

    return raices;
  };

  const columnas = [
    { clave: "nombre", encabezado: "Nombre" },
    { clave: "ruta", encabezado: "Ruta" },
    { clave: "orden", encabezado: "Orden" },
    {
      clave: "icono",
      encabezado: "Icono",
      render: (valor: string) => (valor ? <span>{valor}</span> : "—"),
    },
  ];

  const handleEditar = (modulo: Modulo) => {
    if (!can("modulos", "editar")) {
      router.replace("/403");
      return;
    }
    router.push(`/system/modulos/${modulo.id}?edit=true`);
  };

  const handleEliminar = (modulo: Modulo) => {
    if (!can("modulos", "eliminar")) {
      router.replace("/403");
      return;
    }
    // Depende de cómo quieras implementar el borrado:
    // puedes navegar a una pantalla de confirmación o abrir un modal.
    router.push(`/system/modulos/${modulo.id}?action=delete`);
  };

  // Si no tienes control de los botones dentro de TablaFractal,
  // pasar handlers como undefined ocultará dichas acciones si el componente lo soporta.
  const onEditar = can("modulos", "editar") ? handleEditar : undefined;
  const onEliminar = can("modulos", "eliminar") ? handleEliminar : undefined;

  return (
    <RequirePermiso modulo="modulos" accion="ver" fallback={null}>
      <div className="modulos-page">
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <h1>Gestión de Módulos</h1>
          {usandoFallback && (
            <span
              style={{
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 4,
                background: "#FEF3C7",
                color: "#92400e",
              }}
              title="Mostrando estructura por defecto porque no hay módulos en la base de datos."
            >
              usando datos por defecto
            </span>
          )}
        </div>

        {cargando ? (
          <p>Cargando módulos...</p>
        ) : (
          <>
            {can("modulos", "crear") && <BotonInicializarModulos />}
            <TablaFractal
              titulo="Módulos del sistema"
              columnas={columnas}
              datos={modulos}
              onEditar={onEditar}
              onEliminar={onEliminar}
            />
          </>
        )}
      </div>
    </RequirePermiso>
  );
};

export default PageModulos;
