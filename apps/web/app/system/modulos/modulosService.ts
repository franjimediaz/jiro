export const modulosIniciales = [
  {
    nombre: "Obras",
    ruta: "/obras",
    orden: 1,
    hijos: [
      { nombre: "Tareas", ruta: "/obras/tareas", orden: 1, hijos: [] },
      { nombre: "Servicios", ruta: "/obras/servicios", orden: 2, hijos: [] },
      { nombre: "Materiales", ruta: "/materiales", orden: 3, hijos: [] },
      {
        nombre: "Presupuestos",
        ruta: "/obras/presupuestos",
        orden: 4,
        hijos: [
          {
            nombre: "Facturas",
            ruta: "/obras/presupuestos/facturas",
            orden: 1,
            hijos: [],
          },
          {
            nombre: "Recibos",
            ruta: "/obras/presupuestos/recibos",
            orden: 2,
            hijos: [],
          },
        ],
      },
    ],
  },

  {
    nombre: "Usuarios",
    ruta: "/usuarios",
    orden: 2,
    hijos: [
      { nombre: "Roles", ruta: "/usuarios/roles", orden: 1, hijos: [] },
      {
        nombre: "Directorio Empleados",
        ruta: "/usuarios/directorios",
        orden: 2,
        hijos: [],
      },
      {
        nombre: "Directorio Empresas",
        ruta: "/usuarios/directoriosEmp",
        orden: 2,
        hijos: [],
      },
      {
        nombre: "Configuración",
        ruta: "/usuarios/config",
        orden: 2,
        hijos: [
          {
            nombre: "Tipos de Empleado",
            ruta: "/usuarios/config/TiposEmp",
            orden: 2,
            hijos: [],
          },
          {
            nombre: "Departamentos",
            ruta: "/usuarios/config/Departamentos",
            orden: 2,
            hijos: [],
          },
        ],
      },
    ],
  },
  {
    nombre: "Clientes",
    ruta: "/clientes",
    orden: 3,
    hijos: [],
  },

  {
    nombre: "Configuración",
    ruta: "/system",
    icono: "⚙️",
    orden: 4,
    hijos: [
      { nombre: "Roles", ruta: "/system/roles", orden: 1, hijos: [] },
      { nombre: "Módulos", ruta: "/system/modulos", orden: 2, hijos: [] },
      { nombre: "Estados", ruta: "/system/estados", orden: 3, hijos: [] },
      { nombre: "Branding", ruta: "/system/branding", orden: 4, hijos: [] },
    ],
  },
];
export const obtenerModulosJerarquicos = async (): Promise<any[]> => {
  return modulosIniciales;
};
export const insertarModulosJerarquicos = async (
  modulos: any[],
  padreId: number | null = null
) => {
  for (const mod of modulos) {
    if (!mod.nombre) {
      console.warn("⚠️ Módulo sin nombre detectado, se omite:", mod);
      continue;
    }
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/modulos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: mod.nombre,
        ruta: mod.ruta,
        icono: mod.icono,
        orden: mod.orden,
        padreId: padreId,
      }),
    });

    const nuevo = await res.json();

    if (mod.hijos?.length) {
      await insertarModulosJerarquicos(mod.hijos, nuevo.id);
    }
  }
};
export const eliminarTodosLosModulos = async () => {
  try {
    const confirmacion = confirm(
      "¿Estás seguro de que quieres eliminar todos los módulos? Esta acción no se puede deshacer."
    );
    if (!confirmacion) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/modulos/all`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Error al eliminar los módulos");

    alert("✅ Módulos eliminados correctamente");
    window.location.reload(); // o vuelve a cargar datos si tienes un fetch
  } catch (error) {
    console.error("Error:", error);
    alert("❌ Hubo un problema al eliminar los módulos");
  }
};
