// ✅ Función para aplanar la jerarquía de módulos para permisos
const aplanarModulos = (modulos: any[], resultado: any[] = []): any[] => {
  modulos.forEach((modulo) => {
    // ✅ Solo agregar módulos que no sean solo contenedores
    if (modulo.ruta && !modulo.virtual) {
      resultado.push({
        id: modulo.id,
        nombre: modulo.nombre,
        ruta: modulo.ruta,
        icono: modulo.icono || "📄",
        descripcion: `Gestión de ${modulo.nombre.toLowerCase()}`,
        padre: modulo.padre || null,
      });
    }

    // ✅ Procesar hijos recursivamente
    if (modulo.hijos && modulo.hijos.length > 0) {
      aplanarModulos(modulo.hijos, resultado);
    }
  });

  return resultado;
};

// ✅ Función para obtener módulos para sistema de permisos
export const obtenerModulosParaPermisos = async (): Promise<any[]> => {
  const modulosJerarquicos = await obtenerModulosJerarquicos();

  // ✅ Definir módulos operacionales (que requieren permisos)
  const modulosOperacionales = [
    {
      id: "obras",
      nombre: "Obras",
      ruta: "/obras",

      descripcion: "Gestión de obras y proyectos",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar", "exportar"],
    },
    {
      id: "tareas",
      nombre: "Tareas",
      ruta: "/obras/tareas",

      descripcion: "Gestión de tareas de obras",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar", "asignar"],
    },
    {
      id: "servicios",
      nombre: "Servicios",
      ruta: "/obras/servicios",

      descripcion: "Gestión de servicios disponibles",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar"],
    },
    {
      id: "materiales",
      nombre: "Materiales",
      ruta: "/materiales",

      descripcion: "Gestión de materiales y stock",
      acciones: [
        "acceso",
        "ver",
        "crear",
        "editar",
        "eliminar",
        "exportar",
        "importar",
      ],
    },
    {
      id: "presupuestos",
      nombre: "Presupuestos",
      ruta: "/obras/presupuestos",

      descripcion: "Gestión de presupuestos",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar", "aprobar"],
    },
    {
      id: "facturas",
      nombre: "Facturas",
      ruta: "/obras/presupuestos/facturas",

      descripcion: "Gestión de facturas",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar", "cobrar"],
    },
    {
      id: "recibos",
      nombre: "Recibos",
      ruta: "/obras/presupuestos/recibos",

      descripcion: "Gestión de recibos",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar"],
    },
    {
      id: "usuarios",
      nombre: "Usuarios",
      ruta: "/usuarios",

      descripcion: "Gestión de usuarios del sistema",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar", "activar"],
    },
    {
      id: "roles",
      nombre: "Roles",
      ruta: "/system/roles",

      descripcion: "Gestión de roles y permisos",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar", "asignar"],
    },
    {
      id: "directorios",
      nombre: "Directorio Empleados",
      ruta: "/usuarios/directorios",

      descripcion: "Directorio de empleados",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar", "exportar"],
    },
    {
      id: "clientes",
      nombre: "Clientes",
      ruta: "/clientes",

      descripcion: "Gestión de clientes",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar", "exportar"],
    },
    {
      id: "estados",
      nombre: "Estados",
      ruta: "/system/estados",

      descripcion: "Gestión de estados del sistema",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar"],
    },
    {
      id: "modulos",
      nombre: "Módulos",
      ruta: "/system/modulos",

      descripcion: "Gestión de módulos del sistema",
      acciones: ["acceso", "ver", "administrar"],
    },
    {
      id: "branding",
      nombre: "Branding",
      ruta: "/system/branding",

      descripcion: "Configuración de marca y apariencia",
      acciones: ["acceso", "ver", "editar"],
    },
  ];

  return modulosOperacionales;
};

// ✅ Función para generar estructura de permisos inicial
export const generarEstructuraPermisosInicial = async () => {
  const modulos = await obtenerModulosParaPermisos();
  const permisos: any = {};

  modulos.forEach((modulo) => {
    permisos[modulo.id] = {
      acceso: true,
      ver: false,
      crear: false,
      editar: false,
      eliminar: false,
      exportar: false,
      // ✅ Agregar acciones específicas según el módulo
      ...(modulo.acciones?.includes("asignar") && { asignar: false }),
      ...(modulo.acciones?.includes("aprobar") && { aprobar: false }),
      ...(modulo.acciones?.includes("cobrar") && { cobrar: false }),
      ...(modulo.acciones?.includes("activar") && { activar: false }),
      ...(modulo.acciones?.includes("administrar") && { administrar: false }),
      ...(modulo.acciones?.includes("importar") && { importar: false }),
    };
  });

  return permisos;
};

// ✅ Función para generar plantillas de permisos predefinidas
export const generarPlantillaPermisos = async (
  tipo: "admin" | "manager" | "usuario" | "readonly"
) => {
  const estructura = await generarEstructuraPermisosInicial();

  switch (tipo) {
    case "admin":
      // ✅ Admin: todos los permisos
      Object.keys(estructura).forEach((moduloId) => {
        Object.keys(estructura[moduloId]).forEach((accion) => {
          estructura[moduloId][accion] = true;
        });
      });
      break;

    case "manager":
      // ✅ Manager: todos menos administrar y eliminar críticos
      Object.keys(estructura).forEach((moduloId) => {
        estructura[moduloId] = {
          ...estructura[moduloId],
          ver: true,
          crear: true,
          editar: true,
          exportar: true,
          asignar: true,
          aprobar: true,
          // No eliminar usuarios/roles críticos
          eliminar: !["usuarios", "roles", "modulos"].includes(moduloId),
        };
      });
      break;

    case "usuario":
      // ✅ Usuario: operaciones básicas
      Object.keys(estructura).forEach((moduloId) => {
        estructura[moduloId] = {
          ...estructura[moduloId],
          ver: true,
          // Solo crear en módulos operacionales
          crear: [
            "obras",
            "tareas",
            "materiales",
            "presupuestos",
            "clientes",
          ].includes(moduloId),
          // Solo editar sus propios datos
          editar: ["obras", "tareas", "materiales"].includes(moduloId),
        };
      });
      break;

    case "readonly":
      // ✅ Solo lectura: solo ver
      Object.keys(estructura).forEach((moduloId) => {
        estructura[moduloId] = {
          ...estructura[moduloId],
          ver: true,
        };
      });
      break;
  }

  return estructura;
};

// ✅ Funciones existentes...
const agregarIds = (modulos: any[], contador = { valor: 1 }): any[] => {
  return modulos.map((modulo) => ({
    ...modulo,
    id: contador.valor++,
    hijos: modulo.hijos ? agregarIds(modulo.hijos, contador) : [],
  }));
};

export const modulosIniciales = agregarIds([
  // ... tu estructura existente
  {
    nombre: "Obras",
    ruta: "/obras",
    orden: 1,

    hijos: [
      {
        nombre: "Tareas",
        ruta: "/obras/tareas",
        orden: 1,

        hijos: [],
      },
      {
        nombre: "Servicios",
        ruta: "/obras/servicios",
        orden: 2,

        hijos: [],
      },
      {
        nombre: "Materiales",
        ruta: "/materiales",
        orden: 3,

        hijos: [],
      },
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
      {
        nombre: "Roles",
        ruta: "/usuarios/roles",
        orden: 1,

        hijos: [],
      },
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
      {
        nombre: "Roles",
        ruta: "/system/roles",
        orden: 1,

        hijos: [],
      },
      {
        nombre: "Módulos",
        ruta: "/system/modulos",
        orden: 2,

        hijos: [],
      },
      {
        nombre: "Estados",
        ruta: "/system/estados",
        orden: 3,

        hijos: [],
      },
      {
        nombre: "Branding",
        ruta: "/system/branding",
        orden: 4,

        hijos: [],
      },
    ],
  },
]);

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
      credentials: "include",
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
      credentials: "include",
    });

    if (!res.ok) throw new Error("Error al eliminar los módulos");

    alert("✅ Módulos eliminados correctamente");
    window.location.reload();
  } catch (error) {
    console.error("Error:", error);
    alert("❌ Hubo un problema al eliminar los módulos");
  }
};
