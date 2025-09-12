// ✅ Método HTTP → acción por defecto
const accionPorMetodo = {
  GET: "ver",
  POST: "crear",
  PUT: "editar",
  PATCH: "editar",
  DELETE: "eliminar",
};

// ✅ Cache para módulos (evitar cargar en cada request)
let modulosCache = null;
let ultimaActualizacion = 0;
const CACHE_DURACION = 5 * 60 * 1000; // 5 minutos

// ✅ Definición completa de módulos
function obtenerModulosCompletos() {
  return [
    {
      id: "obras",
      nombre: "Obras",
      ruta: "/obras",
      descripcion: "Gestión de obras y proyectos",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar", "exportar"],
      categoria: "operacional",
      icon: "🏗️",
    },
    {
      id: "tareas",
      nombre: "Tareas",
      ruta: "/obras/tareas",
      descripcion: "Gestión de tareas de obras",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar", "asignar"],
      categoria: "operacional",
      icon: "📋",
      padre: "obras",
    },
    {
      id: "servicios",
      nombre: "Servicios",
      ruta: "/obras/servicios",
      descripcion: "Gestión de servicios disponibles",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar"],
      categoria: "operacional",
      icon: "🔧",
      padre: "obras",
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
      categoria: "operacional",
      icon: "📦",
    },
    {
      id: "presupuestos",
      nombre: "Presupuestos",
      ruta: "/obras/presupuestos",
      descripcion: "Gestión de presupuestos",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar", "aprobar"],
      categoria: "operacional",
      icon: "💰",
      padre: "obras",
    },
    {
      id: "facturas",
      nombre: "Facturas",
      ruta: "/obras/presupuestos/facturas",
      descripcion: "Gestión de facturas",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar", "cobrar"],
      categoria: "operacional",
      icon: "🧾",
      padre: "presupuestos",
    },
    {
      id: "recibos",
      nombre: "Recibos",
      ruta: "/obras/presupuestos/recibos",
      descripcion: "Gestión de recibos",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar"],
      categoria: "operacional",
      icon: "🧾",
      padre: "presupuestos",
    },
    {
      id: "usuarios",
      nombre: "Usuarios",
      ruta: "/usuarios",
      descripcion: "Gestión de usuarios del sistema",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar", "activar"],
      categoria: "administracion",
      icon: "👥",
    },
    {
      id: "roles",
      nombre: "Roles",
      ruta: "/system/roles",
      descripcion: "Gestión de roles y permisos",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar", "asignar"],
      categoria: "sistema",
      icon: "🔐",
    },
    {
      id: "directorios",
      nombre: "Directorio Empleados",
      ruta: "/usuarios/directorios",
      descripcion: "Directorio de empleados",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar", "exportar"],
      categoria: "administracion",
      icon: "📇",
      padre: "usuarios",
    },
    {
      id: "clientes",
      nombre: "Clientes",
      ruta: "/clientes",
      descripcion: "Gestión de clientes",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar", "exportar"],
      categoria: "operacional",
      icon: "🏢",
    },
    {
      id: "estados",
      nombre: "Estados",
      ruta: "/system/estados",
      descripcion: "Gestión de estados del sistema",
      acciones: ["acceso", "ver", "crear", "editar", "eliminar"],
      categoria: "sistema",
      icon: "🔄",
    },
    {
      id: "modulos",
      nombre: "Módulos",
      ruta: "/system/modulos",
      descripcion: "Gestión de módulos del sistema",
      acciones: ["acceso", "ver", "administrar"],
      categoria: "sistema",
      icon: "🧩",
    },
    {
      id: "branding",
      nombre: "Branding",
      ruta: "/system/branding",
      descripcion: "Configuración de marca y apariencia",
      acciones: ["acceso", "ver", "editar"],
      categoria: "sistema",
      icon: "🎨",
    },
  ];
}

// ✅ Obtener módulos con cache
async function obtenerModulosConCache() {
  const ahora = Date.now();

  if (!modulosCache || ahora - ultimaActualizacion > CACHE_DURACION) {
    console.log("🔄 Actualizando cache de módulos...");

    try {
      // ✅ Intentar cargar desde tu servicio TypeScript (si está disponible)
      const {
        obtenerModulosParaPermisos,
      } = require("../../web/app/system/modulos/modulosService");
      modulosCache = await obtenerModulosParaPermisos();

      // ✅ Por ahora usar la definición local
      modulosCache = obtenerModulosCompletos();
    } catch (error) {
      console.warn(
        "⚠️ Error al cargar módulos externos, usando definición local:",
        error.message
      );
      modulosCache = obtenerModulosCompletos();
    }

    ultimaActualizacion = ahora;
    console.log(`✅ Cache actualizado con ${modulosCache.length} módulos`);
  }

  return modulosCache;
}

// ✅ Crear patrones de ruta dinámicamente desde los módulos
function crearPatronesDeRuta(modulos) {
  const patrones = [];

  modulos.forEach((modulo) => {
    let ruta = modulo.ruta;

    // ✅ Escapar caracteres especiales de regex
    ruta = ruta.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // ✅ Patrones más específicos primero
    const rutaEscapada = ruta.replace(/\\\//g, "\\/");

    // Patrón exacto: /usuarios$ o /usuarios/$
    const patronExacto = "^" + rutaEscapada + "(\\/)?$";

    // Patrón con ID: /usuarios/123 o /usuarios/123/cualquier-cosa
    const patronConId = "^" + rutaEscapada + "\\/\\d+(\\/.*)?$";

    // Patrón con subcarpetas: /usuarios/cualquier-cosa
    const patronGeneral = "^" + rutaEscapada + "(\\/.*)?$";

    // ✅ Agregar en orden de especificidad (más específico = mayor prioridad)
    const profundidad = ruta.split("/").length;

    patrones.push({
      pattern: new RegExp(patronExacto),
      moduloId: modulo.id,
      ruta: modulo.ruta,
      tipo: "exacto",
      prioridad: profundidad * 100 + 3, // Máxima prioridad para rutas exactas
    });

    patrones.push({
      pattern: new RegExp(patronConId),
      moduloId: modulo.id,
      ruta: modulo.ruta,
      tipo: "con-id",
      prioridad: profundidad * 100 + 2, // Alta prioridad para rutas con ID
    });

    patrones.push({
      pattern: new RegExp(patronGeneral),
      moduloId: modulo.id,
      ruta: modulo.ruta,
      tipo: "general",
      prioridad: profundidad * 100 + 1, // Prioridad normal para rutas generales
    });
  });

  // ✅ Ordenar por prioridad (mayor prioridad primero)
  patrones.sort((a, b) => b.prioridad - a.prioridad);

  return patrones;
}

// ✅ Detecta acciones "especiales" por sufijo de ruta
function resolverAccion(req) {
  const p = req.path || req.originalUrl || "";
  const metodo = req.method;

  console.log(`🎯 Resolviendo acción para: ${metodo} ${p}`);

  // ✅ Acciones especiales por sufijo de ruta (orden de especificidad)
  const accionesEspeciales = [
    { patron: /\/aprobar(\/|$)/, accion: "aprobar" },
    { patron: /\/cobrar(\/|$)/, accion: "cobrar" },
    { patron: /\/asignar(\/|$)/, accion: "asignar" },
    { patron: /\/activar(\/|$)/, accion: "activar" },
    { patron: /\/desactivar(\/|$)/, accion: "activar" }, // Misma acción que activar
    { patron: /\/importar(\/|$)/, accion: "importar" },
    { patron: /\/exportar(\/|$)/, accion: "exportar" },
    { patron: /\/administrar(\/|$)/, accion: "administrar" },
    { patron: /\/duplicar(\/|$)/, accion: "crear" }, // Duplicar requiere permiso de crear
    { patron: /\/clonar(\/|$)/, accion: "crear" },
    { patron: /\/restore(\/|$)/, accion: "editar" }, // Restaurar requiere permiso de editar
    { patron: /\/archive(\/|$)/, accion: "editar" },
  ];

  for (const { patron, accion } of accionesEspeciales) {
    if (patron.test(p)) {
      console.log(`📋 Acción especial detectada: ${accion}`);
      return accion;
    }
  }

  // ✅ Acción por método HTTP
  const accion = accionPorMetodo[metodo] || "ver";
  console.log(`📋 Acción por método ${metodo}: ${accion}`);
  return accion;
}

// ✅ Resolver módulo con logs detallados
async function resolverModulo(ruta) {
  console.log(`🔍 Resolviendo módulo para ruta: ${ruta}`);

  try {
    const modulos = await obtenerModulosConCache();
    const patrones = crearPatronesDeRuta(modulos);

    console.log(`🔍 Probando ${patrones.length} patrones para: ${ruta}`);

    for (const patron of patrones) {
      if (patron.pattern.test(ruta)) {
        console.log(
          `✅ Módulo encontrado: ${patron.moduloId} (ruta: ${patron.ruta}, tipo: ${patron.tipo}, prioridad: ${patron.prioridad})`
        );
        return patron.moduloId;
      }
    }

    console.log(`⚠️ No se encontró módulo para la ruta: ${ruta}`);
    return null;
  } catch (error) {
    console.error(`❌ Error al resolver módulo para ${ruta}:`, error);
    return null;
  }
}

// ✅ Función para obtener todos los módulos mapeados
async function obtenerModulosMapeados() {
  try {
    const modulos = await obtenerModulosConCache();
    return modulos.map((m) => m.id);
  } catch (error) {
    console.error("❌ Error al obtener módulos mapeados:", error);
    return [];
  }
}

// ✅ Función para verificar si una ruta está mapeada
async function esRutaMapeada(ruta) {
  try {
    const moduloId = await resolverModulo(ruta);
    return moduloId !== null;
  } catch (error) {
    console.error(`❌ Error al verificar ruta ${ruta}:`, error);
    return false;
  }
}

// ✅ Función para debug: mostrar todas las rutas mapeadas
async function debugRutas() {
  try {
    const modulos = await obtenerModulosConCache();
    console.log("📋 Módulos mapeados:");
    modulos.forEach((modulo, index) => {
      console.log(
        `  ${index + 1}. ${modulo.ruta} → ${modulo.id} (${modulo.nombre}) [${modulo.categoria}]`
      );
      if (modulo.acciones && modulo.acciones.length > 0) {
        console.log(`     Acciones: ${modulo.acciones.join(", ")}`);
      }
    });
    return modulos;
  } catch (error) {
    console.error("❌ Error al mostrar debug de rutas:", error);
    return [];
  }
}

// ✅ Función para obtener módulo específico por ID
async function obtenerModuloPorId(moduloId) {
  try {
    const modulos = await obtenerModulosConCache();
    const modulo = modulos.find((m) => m.id === moduloId);

    if (!modulo) {
      console.warn(`⚠️ Módulo no encontrado: ${moduloId}`);
      return null;
    }

    return modulo;
  } catch (error) {
    console.error(`❌ Error al obtener módulo ${moduloId}:`, error);
    return null;
  }
}

// ✅ Función para obtener módulos por categoría
async function obtenerModulosPorCategoria() {
  try {
    const modulos = await obtenerModulosConCache();
    const categorias = {};

    modulos.forEach((modulo) => {
      const categoria = modulo.categoria || "sin-categoria";
      if (!categorias[categoria]) {
        categorias[categoria] = [];
      }
      categorias[categoria].push(modulo);
    });

    return categorias;
  } catch (error) {
    console.error("❌ Error al agrupar módulos por categoría:", error);
    return {};
  }
}

// ✅ Función para validar si una acción existe en un módulo
async function validarAccionEnModulo(moduloId, accion) {
  try {
    const modulo = await obtenerModuloPorId(moduloId);
    if (!modulo) {
      return false;
    }

    return modulo.acciones && modulo.acciones.includes(accion);
  } catch (error) {
    console.error(
      `❌ Error al validar acción ${accion} en módulo ${moduloId}:`,
      error
    );
    return false;
  }
}

// ✅ Limpiar cache manualmente
function limpiarCache() {
  modulosCache = null;
  ultimaActualizacion = 0;
  console.log("🧹 Cache de módulos limpiado");
}

// ✅ Función para forzar recarga de cache
async function recargarCache() {
  limpiarCache();
  const modulos = await obtenerModulosConCache();
  console.log(`🔄 Cache recargado con ${modulos.length} módulos`);
  return modulos;
}

// ✅ Función para obtener estadísticas del cache
function obtenerEstadisticasCache() {
  return {
    cacheActivo: modulosCache !== null,
    ultimaActualizacion: ultimaActualizacion
      ? new Date(ultimaActualizacion)
      : null,
    tiempoRestante: ultimaActualizacion
      ? Math.max(0, CACHE_DURACION - (Date.now() - ultimaActualizacion))
      : 0,
    cantidadModulos: modulosCache ? modulosCache.length : 0,
  };
}

// ✅ Exportar todas las funciones
module.exports = {
  // Funciones principales
  accionPorMetodo,
  resolverAccion,
  resolverModulo,
  obtenerModulosConCache,

  // Funciones de utilidad
  obtenerModulosMapeados,
  esRutaMapeada,
  obtenerModuloPorId,
  obtenerModulosPorCategoria,
  validarAccionEnModulo,

  // Funciones de debug y mantenimiento
  debugRutas,
  limpiarCache,
  recargarCache,
  obtenerEstadisticasCache,

  // Funciones internas (para testing)
  crearPatronesDeRuta,
  obtenerModulosCompletos,
};
