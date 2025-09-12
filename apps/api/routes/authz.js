const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { resolverAccion, resolverModulo } = require("./permisosMapa");

const prisma = new PrismaClient();

const RUTAS_PUBLICAS = [
  /^\/login$/,
  /^\/logout$/,
  /^\/health$/,
  /^\/debug\/usuario\/\d+$/,
  /^\/debug\/token$/,
  /^\/debug\/mapeo$/,
  /^\/uploads\//,
  /^\/api\/upload/,
  /^\/api\/documentos/,
  /^\/api\//,
  /^\/$/, // Ruta raíz
];

module.exports = async function authz(req, res, next) {
  try {
    console.log(`🔒 Authz middleware - ${req.method} ${req.path}`);
    console.log(`🔒 MIDDLEWARE AUTHZ EJECUTÁNDOSE para: ${req.path}`);

    // ✅ Excepciones: rutas públicas y preflight
    if (req.method === "OPTIONS") {
      console.log("✅ OPTIONS request - permitido");
      return next();
    }

    const esRutaPublica = RUTAS_PUBLICAS.some((r) => r.test(req.path));
    if (esRutaPublica) {
      console.log(`✅ Ruta pública permitida: ${req.path}`);
      return next();
    }

    // ✅ 1) Extraer token
    const header = req.headers.authorization || "";
    const tokenHeader = header.startsWith("Bearer ") ? header.slice(7) : null;
    const token = req.cookies?.token || tokenHeader;

    console.log(`🎫 Token encontrado:`, {
      hasToken: !!token,
      fromHeader: !!tokenHeader,
      fromCookie: !!req.cookies?.token,
      path: req.path,
    });

    if (!token) {
      console.log("❌ No hay token de autenticación");
      return res
        .status(401)
        .json({ error: "No autenticado - token requerido" });
    }

    // ✅ 2) Verificar JWT
    let payload;
    try {
      payload = jwt.verify(
        token,
        process.env.JWT_SECRET || "secretoSuperSeguro"
      );
      console.log(`🔍 Token decodificado:`, {
        id: payload.id,
        rolId: payload.rolId,
        rolNombre: payload.rolNombre,
      });
    } catch (jwtError) {
      console.log("❌ Token JWT inválido:", jwtError.message);
      return res.status(401).json({ error: "Token inválido o expirado" });
    }

    // ✅ 3) Cargar usuario
    console.log(`👤 Buscando usuario con ID: ${payload.id}`);

    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.id },
      include: { rol: true },
    });

    console.log(`👤 Usuario encontrado:`, {
      existe: !!usuario,
      activo: usuario?.activo,
      tieneRol: !!usuario?.rol,
      rolNombre: usuario?.rol?.nombre,
      rolActivo: usuario?.rol?.activo,
    });

    if (!usuario || !usuario.activo) {
      console.log("❌ Usuario inactivo o no encontrado");
      return res
        .status(401)
        .json({ error: "Usuario inactivo o no encontrado" });
    }

    if (!usuario.rol || !usuario.rol.activo) {
      console.log("❌ Usuario sin rol activo");
      return res.status(403).json({
        error: "Sin rol asignado o rol inactivo",
      });
    }

    // ✅ 4) Resolver permisos usando funciones async correctamente
    const permisos = usuario.rol?.permisos || {};

    // ✅ IMPORTANTE: Usar await para funciones async
    const moduloId = await resolverModulo(req.path);
    const accion = resolverAccion(req); // Esta función NO es async

    console.log(`🎯 Verificando permisos:`, {
      ruta: req.path,
      moduloId,
      accion,
      tienePermisos: Object.keys(permisos).length > 0,
    });

    // ✅ Si no hay módulo mapeado, permitir acceso
    if (!moduloId) {
      console.log(`⚠️ Módulo no mapeado para: ${req.path} - PERMITIENDO`);
      req.usuario = {
        id: usuario.id,
        idUsuario: usuario.idUsuario,
        nombre: usuario.nombre,
        email: usuario.email,
        rolId: usuario.rolId,
        rol: usuario.rol,
        permisos,
      };
      return next();
    }

    // ✅ Verificar permisos del módulo
    const permisoModulo = permisos[moduloId];
    if (!permisoModulo) {
      console.log(`❌ Sin permisos para módulo: ${moduloId}`);
      return res.status(403).json({
        error: `Sin acceso a módulo ${moduloId}`,
        debug: {
          modulosSolicitado: moduloId,
          modulosDisponibles: Object.keys(permisos),
        },
      });
    }

    // ✅ Verificar "acceso" general al módulo
    if (permisoModulo.hasOwnProperty("acceso") && !permisoModulo.acceso) {
      console.log(`❌ Sin acceso general al módulo: ${moduloId}`);
      return res.status(403).json({
        error: `Sin acceso a módulo ${moduloId}`,
        debug: { acceso: permisoModulo.acceso },
      });
    }

    // ✅ Verificar acción específica
    if (!permisoModulo[accion]) {
      console.log(
        `❌ Sin permiso para acción "${accion}" en módulo "${moduloId}"`
      );
      return res.status(403).json({
        error: `Permiso '${accion}' denegado en ${moduloId}`,
        debug: {
          accionSolicitada: accion,
          accionesDisponibles: Object.keys(permisoModulo).filter(
            (k) => permisoModulo[k] === true
          ),
        },
      });
    }

    console.log(`✅ Permiso concedido: ${accion} en ${moduloId}`);

    // ✅ 5) Agregar usuario al request
    req.usuario = {
      id: usuario.id,
      idUsuario: usuario.idUsuario,
      nombre: usuario.nombre,
      email: usuario.email,
      rolId: usuario.rolId,
      rol: usuario.rol,
      permisos,
    };

    return next();
  } catch (err) {
    console.error("❌ Error en authz middleware:", err);
    console.error("Stack trace:", err.stack); // ✅ Agregar stack trace para debugging

    return res.status(500).json({
      error: "Error interno de autorización",
      debug:
        process.env.NODE_ENV === "development"
          ? {
              message: err.message,
              stack: err.stack,
            }
          : undefined,
    });
  }
};
