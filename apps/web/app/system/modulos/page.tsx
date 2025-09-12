"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TablaFractal from "../../components/TablaFractal";
import { obtenerModulosJerarquicos } from "./modulosService";
import BotonInicializarModulos from "./utils/BotonInicializarModulos";

const PageModulos = () => {
  const [modulos, setModulos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [usandoFallback, setUsandoFallback] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const cargarModulos = async () => {
      setCargando(true);
      setUsandoFallback(false);

      try {
        // ✅ 1. Intentar cargar desde la base de datos
        console.log("Intentando cargar módulos desde DB...");
        const response = await fetch("http://localhost:3001/modulos", {
          credentials: "include",
        });

        if (response.ok) {
          const modulosDB = await response.json();

          // ✅ Verificar si hay módulos en la DB
          if (modulosDB && modulosDB.length > 0) {
            console.log("✅ Módulos cargados desde DB:", modulosDB.length);

            // ✅ Convertir estructura plana a jerárquica si es necesario
            const modulosJerarquicos = construirJerarquia(modulosDB);
            setModulos(modulosJerarquicos);
          } else {
            console.log("⚠️ No hay módulos en DB, usando datos por defecto...");
            throw new Error("No hay módulos en la base de datos");
          }
        } else {
          console.log("❌ Error al obtener módulos de DB, usando fallback...");
          throw new Error(`Error HTTP: ${response.status}`);
        }
      } catch (error) {
        // ✅ 2. Si falla, usar obtenerModulosJerarquicos como fallback
        console.error("Error al cargar desde DB:", error);
        console.log("🔄 Usando módulos por defecto...");

        try {
          const modulosPorDefecto = await obtenerModulosJerarquicos();
          setModulos(modulosPorDefecto);
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
  }, []);

  const construirJerarquia = (modulosPlanos: any[]): any[] => {
    const mapaModulos = new Map();
    const raices: any[] = [];

    modulosPlanos.forEach((modulo) => {
      mapaModulos.set(modulo.id, { ...modulo, hijos: [] });
    });

    mapaModulos.forEach((modulo) => {
      if (modulo.padreId) {
        const padre = mapaModulos.get(modulo.padreId);
        if (padre) {
          padre.hijos.push(modulo);
        }
      } else {
        raices.push(modulo);
      }
    });

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

  //-----------------------------------

  const handleEditar = (modulo: any) => {
    console.log("Editar módulo", modulo);
    // ✅ Navegar a la página de edición del módulo
    router.push(`/system/modulos/${modulo.id}?edit=true`);
  };
  const handleEliminar = (modulo: any) => {
    console.log("Eliminar módulo", modulo);
    // ✅ También puedes navegar a una página de confirmación
    router.push(`/system/modulos/${modulo.id}?action=delete`);
  };

  return (
    <div className="modulos-page">
      <h1>Gestión de Módulos</h1>
      {cargando ? (
        <p>Cargando módulos...</p>
      ) : (
        <>
          <BotonInicializarModulos />
          <TablaFractal
            titulo="Módulos del sistema"
            columnas={columnas}
            datos={modulos}
            onEditar={handleEditar}
            onEliminar={handleEliminar}
          />
        </>
      )}
    </div>
  );
};

export default PageModulos;
