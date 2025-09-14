const express = require("express");
const cors = require("cors");
require("./scripts/initAdmin");
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const uploadRoutes = require("./routes/upload");
const documentosRoutes = require("./routes/documentos");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const prisma = new PrismaClient();
const loginRouter = require("./routes/login");
const cookieParser = require("cookie-parser");
const authz = require("./routes/authz");
const PORT = process.env.PORT || 3001;
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3002",
  "http://localhost:3001",
  "http://dominio.com",
];
function toNullableString(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function toIntOrNull(v) {
  const s = toNullableString(v);
  if (s === null) return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : Math.trunc(n);
}

function toDecimalStringOrNull(v) {
  const s = toNullableString(v);
  if (s === null) return null;
  const norm = s.replace(",", ".");
  return /^-?\d+(\.\d+)?$/.test(norm) ? norm : null;
}

function toBoolOrUndefined(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const t = v.toLowerCase();
    if (t === "true") return true;
    if (t === "false") return false;
  }
  return undefined; // deja que Prisma aplique defaults
}
function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token; // login guarda 'token'
    if (!token) return res.status(401).json({ error: "No auth token" });

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "secretoSuperSeguro"
    );
    // En el login firmas: { id: usuario.idUsuario, rol: usuario.rol }
    req.user = { id: Number(payload.id), rol: payload.rol };
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

app.use(cookieParser());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

// Rutas de autenticación
//app.use("/login", loginRouter);

//  Servir archivos estáticos desde /uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//  Rutas API
app.use("/api/upload", uploadRoutes); // subida real: POST /api/upload
app.use("/api/documentos", documentosRoutes);
app.use("/api", uploadRoutes);

//////////////////////////////////////////////////////////
// Rutas de debug públicas
//////////////////////////////////////////////////////////

app.get("/debug/usuario/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        rol: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      usuario: {
        id: usuario.id,
        idUsuario: usuario.idUsuario,
        nombre: usuario.nombre,
        email: usuario.email,
        activo: usuario.activo,
        rolId: usuario.rolId,
      },
      rol: {
        id: usuario.rol?.id,
        nombre: usuario.rol?.nombre,
        activo: usuario.rol?.activo,
        permisos: usuario.rol?.permisos,
      },
      debug: {
        tieneRol: !!usuario.rol,
        tienePermisos: !!usuario.rol?.permisos,
        cantidadModulos: Object.keys(usuario.rol?.permisos || {}).length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/debug/token", (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token requerido" });
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "secretoSuperSeguro"
    );

    res.json({
      valid: true,
      payload,
      decoded: {
        id: payload.id,
        rolId: payload.rolId,
        exp: new Date(payload.exp * 1000),
        iat: new Date(payload.iat * 1000),
      },
    });
  } catch (error) {
    res.json({
      valid: false,
      error: error.message,
    });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña obligatorios" });
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { rol: true },
    });

    if (!usuario || !usuario.activo) {
      return res
        .status(401)
        .json({ error: "Usuario no encontrado o inactivo" });
    }

    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValida) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // ✅ Generar token con el ID correcto
    const token = jwt.sign(
      {
        id: usuario.id, // ✅ Usar usuario.id (no idUsuario)
        rolId: usuario.rolId,
        rolNombre: usuario.rol?.nombre,
      },
      process.env.JWT_SECRET || "secretoSuperSeguro",
      { expiresIn: "1d" }
    );

    // Enviar como cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 día
    });

    // Devolver solo datos públicos del usuario
    res.json({
      usuario: {
        id: usuario.id, // ✅ Usar usuario.id
        idUsuario: usuario.idUsuario,
        nombre: usuario.nombre,
        rolId: usuario.rolId,
        rolNombre: usuario.rol?.nombre,
        email: usuario.email,
      },
    });
  } catch (err) {
    console.error("❌ Error en login:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.json({ success: true });
});
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

app.get("/", (req, res) => {
  res.json({ mensaje: "API JiRo funcionando", timestamp: new Date() });
});

app.get("/test/middleware", (req, res) => {
  res.json({
    mensaje: "Endpoint público funcionando",
    headers: req.headers,
    cookies: req.cookies,
    timestamp: new Date().toISOString(),
  });
});

app.get("/debug/cookies", (req, res) => {
  res.json({
    cookies: req.cookies,
    headers: {
      cookie: req.headers.cookie,
      authorization: req.headers.authorization,
      userAgent: req.headers["user-agent"],
    },
    timestamp: new Date().toISOString(),
  });
});

//////////////////////////////////////////////////////////
// Middleware
//////////////////////////////////////////////////////////
console.log("🔒 Aplicando middleware de autorización...");
app.use(authz);

//////////////////////////////////////////////////////////
//  Rutas para GET
//////////////////////////////////////////////////////////

/////////////////DEBUG///////////////////////
app.get("/debug/permisos", (req, res) => {
  try {
    console.log("🔍 Debug permisos - Usuario en request:", !!req.usuario);

    res.json({
      autenticado: !!req.usuario,
      usuario: req.usuario
        ? {
            id: req.usuario.id,
            nombre: req.usuario.nombre,
            rolId: req.usuario.rolId,
            rol: req.usuario.rol?.nombre,
          }
        : null,
      permisos: req.usuario?.permisos || {},
      cantidadModulos: Object.keys(req.usuario?.permisos || {}).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error en debug permisos:", error);
    res.status(500).json({
      error: "Error en debug permisos",
      detalles: error.message,
    });
  }
});

//  Endpoint para obtener permisos del usuario autenticado
app.get("/me/permissions", (req, res) => {
  try {
    console.log("🔍 Me/permissions - Usuario en request:", !!req.usuario);

    if (!req.usuario?.permisos) {
      return res.status(401).json({ error: "No autenticado o sin permisos" });
    }

    res.json({
      permisos: req.usuario.permisos,
      usuario: {
        id: req.usuario.id,
        nombre: req.usuario.nombre,
        rol: req.usuario.rol?.nombre,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error en me/permissions:", error);
    res.status(500).json({
      error: "Error al obtener permisos",
      detalles: error.message,
    });
  }
});

app.get("/test/protegido", (req, res) => {
  res.json({
    mensaje: "Endpoint protegido funcionando",
    usuario: req.usuario
      ? {
          id: req.usuario.id,
          nombre: req.usuario.nombre,
          rol: req.usuario.rol?.nombre,
        }
      : null,
    middlewareAplicado: true,
    timestamp: new Date().toISOString(),
  });
});
//////////////////////////////////////////////////////////
app.get("/obras", async (req, res) => {
  try {
    const obras = await prisma.obra.findMany();
    res.json(obras);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener obras" });
  }
});
app.get("/clientes", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany();
    res.json(clientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener clientes" });
  }
});
app.get("/presupuestos", async (req, res) => {
  try {
    const presupuesto = await prisma.presupuesto.findMany();
    res.json(presupuesto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener presupuestos" });
  }
});
app.get("/obras/tareas", async (req, res) => {
  try {
    const tareas = await prisma.servicios_Tarea.findMany({
      include: {
        tarea: {
          include: {
            estado: true,
          },
        },
        servicio: true,
      },
    });

    const tareasFormateadas = tareas
      .filter((st) => st.tarea)
      .map((st) => ({
        id: st.tarea.id,
        nombre: st.tarea.nombre,
        estado: st.tarea.estado?.nombre || "Sin estado",
        servicio: st.servicio?.nombre || "",
        direccion: st.tarea.direccion,
      }));

    res.json(tareasFormateadas); // ✅ debe devolver un array
  } catch (error) {
    console.error("Error al obtener tareas", error);
    res.status(500).json({ error: "Error al obtener tareas" }); // ❌ Esto es lo que llega si falla
  }
});
app.get("/obras/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const obra = await prisma.obra.findUnique({ where: { id } });
    if (!obra) return res.status(404).json({ error: "Obra no encontrada" });
    res.json(obra);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener obra" });
  }
});
app.get("/clientes/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
    });

    if (!cliente)
      return res.status(404).json({ error: "Cliente no encontrado" });

    res.json(cliente);
  } catch (error) {
    console.error("❌ Error al obtener cliente:", error);
    res.status(500).json({ error: "Error al obtener cliente" });
  }
});
app.get("/obras/tareas/:obraId", async (req, res) => {
  const obraId = parseInt(req.params.obraId);

  if (isNaN(obraId)) {
    return res.status(400).json({ error: "ID de obra no válido" });
  }

  try {
    const serviciosTareas = await prisma.servicios_Tarea.findMany({
      where: { obraId },
      include: {
        tarea: true,
        servicio: true,
      },
    });

    const tareas = serviciosTareas
      .filter((st) => st.tarea)
      .map((st) => ({
        id: st.tarea.id,
        nombre: st.tarea.nombre,
        descripcion: st.tarea.descripcion,
        estado: st.tarea.estado,
        servicio: st.servicio?.nombre,
        fechaInicio: st.fechaInicio,
        fechaFin: st.fechaFin,
      }));

    res.json(tareas);
  } catch (err) {
    console.error("[GET /obras/tareas/:obraId] Error:", err);
    res.status(500).json({
      error: "Error al obtener tareas por obra",
      detalle: err.message,
    });
  }
});
app.get("/servicios_tarea/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  console.log("📥 [GET /servicios_tarea/:id] llamada con ID:", req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "ID no válido" });
  }

  try {
    const tarea = await prisma.servicios_Tarea.findUnique({
      where: { id },
      include: {
        tarea: true,
        servicio: true,
        material: true,
        obra: true,
        usuario: true,
      },
    });

    if (!tarea) {
      return res
        .status(404)
        .json({ error: "No se encontró la tarea con ese ID" });
    }

    res.json(tarea);
  } catch (error) {
    console.error("[GET /servicios_tarea/:id] Error:", error);
    res
      .status(500)
      .json({ error: "Error al obtener la tarea", detalle: error.message });
  }
});
app.get("/obras/:obraId/servicios-tareas", async (req, res) => {
  const { obraId } = req.params;

  try {
    const serviciosTareas = await prisma.servicios_Tarea.findMany({
      where: { obraId: Number(obraId) },
      include: {
        servicio: true,
        tarea: true,
      },
    });

    const agrupado = serviciosTareas.reduce((acc, item) => {
      const servicioId = item.servicioId;

      if (!acc[servicioId]) {
        acc[servicioId] = {
          id: servicioId,
          nombre: item.servicio.nombre,
          serviciosTarea: [], // ✅ este es el campo que espera tu frontend
        };
      }

      acc[servicioId].serviciosTarea.push({
        id: item.id, // id de la tabla Servicios_Tarea
        fechaInicio: item.fechaInicio,
        fechaFin: item.fechaFin,
        total: item.total,
        tarea: item.tarea
          ? {
              id: item.tarea.id,
              nombre: item.tarea.nombre,
              descripcion: item.tarea.descripcion,
            }
          : null,
      });

      return acc;
    }, {});

    const resultado = Object.values(agrupado);
    res.json(resultado);
  } catch (err) {
    console.error("[GET /obras/:obraId/servicios-tareas]", err);
    res.status(500).json({
      error: "Error al obtener servicios y tareas",
      detalle: err.message,
    });
  }
});
app.get("/servicios", async (req, res) => {
  try {
    const servicios = await prisma.servicios.findMany({
      orderBy: { nombre: "asc" }, // Opcional: orden alfabético
    });

    res.status(200).json(servicios);
  } catch (error) {
    console.error("Error al obtener servicios:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});
app.get("/materiales", async (req, res) => {
  try {
    const materiales = await prisma.materiales.findMany();
    res.json(materiales);
  } catch (error) {
    console.error("[GET /materiales] Error al obtener materiales:", error);
    res.status(500).json({ error: "Error al obtener materiales" });
  }
});
app.get("/servicios/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const servicio = await prisma.servicios.findUnique({ where: { id } });
    if (!servicio)
      return res.status(404).json({ error: "Servicio no encontrada" });
    res.json(servicio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener obra" });
  }
});
app.get("/tareas/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const tarea = await prisma.tareas.findUnique({ where: { id } });
    if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });
    res.json(tarea);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener obra" });
  }
});
app.get("/tareas", async (req, res) => {
  try {
    const tareas = await prisma.tareas.findMany({
      orderBy: { nombre: "asc" }, // Opcional: orden alfabético
    });

    res.status(200).json(tareas);
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});
app.get("/estados", async (req, res) => {
  try {
    const estados = await prisma.estados.findMany({
      orderBy: { nombre: "asc" }, // Opcional: orden alfabético
    });

    res.status(200).json(estados);
  } catch (error) {
    console.error("Error al obtener estados:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});
app.get("/estados/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const estado = await prisma.estados.findUnique({ where: { id } });
    if (!estado) return res.status(404).json({ error: "Estado no encontrada" });
    res.json(estado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener estado" });
  }
});
app.get("/st_material/por-servicio/:servicioTareaId", async (req, res) => {
  const id = Number(req.params.servicioTareaId);
  console.log("📥 Buscando ST_Material con ServicioTareaId =", id); // 👈

  const materiales = await prisma.sT_Material.findMany({
    where: { ServicioTareaId: id },
    include: { material: true },
  });

  console.log("🧾 Materiales encontrados:", materiales); // 👈
  res.json(materiales);
});
app.get("/presupuestos/por-obra/:obraId", async (req, res) => {
  const id = Number(req.params.obraId);
  console.log("📥 Buscando presupuestos con obraId =", id); // 👈

  try {
    const presupuestos = await prisma.presupuesto.findMany({
      where: { obraId: id },
      orderBy: { createdAt: "desc" },
      // include: { cliente: true, obra: true }
    });

    console.log("🧾 Presupuestos encontrados:", presupuestos); // 👈
    res.json(presupuestos);
  } catch (error) {
    console.error("❌ Error al buscar presupuestos:", error);
    res.status(500).json({ error: "Error al obtener presupuestos" });
  }
});
app.get("/presupuestos/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  try {
    const presupuesto = await prisma.presupuesto.findUnique({
      where: { id },
    });

    if (!presupuesto) return res.status(404).json({ error: "No encontrado" });

    res.json(presupuesto);
  } catch (error) {
    console.error("❌ Error al obtener presupuesto:", error);
    res.status(500).json({ error: "Error al obtener presupuesto" });
  }
});
app.get("/branding", async (req, res) => {
  try {
    const branding = await prisma.branding.findFirst();

    if (!branding)
      return res.status(404).json({ error: "Branding no configurado" });

    res.json(branding);
  } catch (error) {
    console.error("❌ Error al obtener branding:", error);
    res.status(500).json({ error: "Error al obtener branding" });
  }
});
app.get("/presupuestos/importe-por-obra/:obraId", async (req, res) => {
  const obraId = Number(req.params.obraId);

  try {
    const serviciosTarea = await prisma.servicios_Tarea.findMany({
      where: { obraId },
    });

    const totalImporte = serviciosTarea.reduce((total, st) => {
      const unidades = st.unidades ?? 0;
      const precioUnidad = st.precioUnidad ?? 0;
      const precioManoObra = st.precioManoObra ?? 0;

      return total + unidades * precioUnidad + precioManoObra;
    }, 0);

    res.json({ importe: totalImporte });
  } catch (error) {
    console.error("❌ Error al calcular importe:", error);
    res.status(500).json({ error: "Error al calcular importe" });
  }
});
app.get("/presupuestos/:id/arbol", async (req, res) => {
  const { id } = req.params;

  try {
    const serviciosPresupuesto = await prisma.presupuesto_Servicio.findMany({
      where: {
        presupuestoId: Number(id),
      },
      include: {
        tareas: {
          include: {
            materiales: true,
          },
        },
      },
    });

    const estructura = serviciosPresupuesto.map((servicio) => ({
      servicioNombre: servicio.nombre,
      tareas: servicio.tareas.map((tarea) => ({
        nombre: tarea.nombre,
        descripcion: tarea.descripcion,
        precioManoObra: tarea.precioManoObra,
        total: tarea.total,
        cantidad: tarea.cantidad,
        materiales: tarea.materiales.map((mat) => ({
          nombre: mat.nombre,
          cantidad: mat.cantidad,
          precioUnidad: mat.precioUnidad,
          facturable: mat.facturable,
        })),
      })),
    }));

    res.json(estructura);
  } catch (error) {
    console.error("❌ Error al obtener estructura del presupuesto:", error);
    res
      .status(500)
      .json({ error: "Error al obtener el árbol del presupuesto" });
  }
});
app.get("/presupuestos/:id/cliente", async (req, res) => {
  const id = Number(req.params.id);
  console.log("📥 Buscando presupuesto con ID:", id);
  try {
    const presupuesto = await prisma.presupuesto.findUnique({
      where: { id },
      include: { Cliente: true },
    });

    console.log("🧾 Resultado presupuesto:", presupuesto);

    if (!presupuesto) {
      return res.status(404).json({ error: "Presupuesto no encontrado" });
    }

    if (!presupuesto.Cliente) {
      return res.status(404).json({ error: "Cliente no vinculado" });
    }

    res.json(presupuesto.Cliente);
  } catch (error) {
    console.error("❌ Error al obtener cliente del presupuesto:", error);
    res.status(500).json({ error: "Error interno", detalle: error.message });
  }
});
app.get("/usuarios", async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        idUsuario: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        rolId: true, // ✅ Incluir rolId
        activo: true,
        createdAt: true,
        updatedAt: true,
        // ✅ Incluir información del rol asignado
        rol: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            nivel: true,
            activo: true,
          },
        },
      },
      orderBy: { nombre: "asc" },
    });

    res.status(200).json(usuarios);
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});
app.get("/usuarios/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    console.log("🧪 Buscando usuario con ID:", id);
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        idUsuario: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        rolId: true, // ✅ Incluir rolId
        activo: true,
        createdAt: true,
        updatedAt: true,
        // ✅ Incluir información del rol asignado
        rol: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            nivel: true,
            activo: true,
          },
        },
      },
    });

    if (!usuario)
      return res.status(404).json({ error: "Usuario no encontrado" });

    res.json(usuario);
  } catch (error) {
    console.error("❌ Error exacto:", error);
    res.status(500).json({ error: "Error al obtener Usuario" });
  }
});
app.get("/servicios_tarea/por-tarea/:tareaId", async (req, res) => {
  const tareaId = parseInt(req.params.tareaId);

  if (isNaN(tareaId)) {
    return res.status(400).json({ error: "ID de tarea inválido" });
  }

  try {
    const servicioTarea = await prisma.servicios_Tarea.findFirst({
      where: { tareaId },
      include: {
        obra: true,
        servicio: true,
        tarea: true,
      },
    });

    if (!servicioTarea) {
      return res
        .status(404)
        .json({ error: "No se encontró relación con esa tarea" });
    }

    res.json(servicioTarea);
  } catch (error) {
    console.error("❌ Error al obtener servicios_tarea por tareaId:", error);
    res.status(500).json({ error: "Error interno", detalle: error.message });
  }
});
app.get("/facturas", async (req, res) => {
  try {
    const facturas = await prisma.facturas.findMany();
    res.json(facturas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener facturas" });
  }
});
app.get("/facturas/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    console.log("🧪 Buscando factura con ID:", id);
    const factura = await prisma.facturas.findUnique({ where: { id } });

    if (!factura)
      return res.status(404).json({ error: "Factura no encontrada" });

    res.json(factura);
  } catch (error) {
    console.error("❌ Error exacto:", error);
    res.status(500).json({ error: "Error al obtener Factura" });
  }
});
app.get("/obras/count", async (req, res) => {
  try {
    const total = await prisma.obra.count();
    res.json({ count: total });
  } catch (error) {
    console.error("Error al contar obras:", error);
    res.status(500).json({ error: "Error al contar obras" });
  }
});
app.get("/directorios", async (req, res) => {
  try {
    const { usuarioId } = req.query;

    if (usuarioId !== undefined) {
      const uid = Number(usuarioId);
      if (Number.isNaN(uid))
        return res.status(400).json({ error: "usuarioId inválido" });

      const uno = await prisma.directorios.findUnique({
        where: { usuarioId: uid },
      });
      if (!uno)
        return res
          .status(404)
          .json({ error: "No hay directorio para ese usuario" });
      return res.json(uno);
    }

    // … tu listado general (paginado, filtros, etc.)
    const lista = await prisma.directorios.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    return res.json(lista);
  } catch (e) {
    console.error("[GET /directorios] Error:", e);
    return res.status(500).json({ error: "Error obteniendo directorios" });
  }
});
app.get("/directorios/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "id inválido" });

    const dir = await prisma.directorios.findUnique({ where: { id } });
    if (!dir)
      return res.status(404).json({ error: "Directorio no encontrado" });

    return res.json(dir);
  } catch (e) {
    console.error("[GET /directorios/:id] Error:", e);
    return res.status(500).json({ error: "Error obteniendo directorio" });
  }
});
app.get("/modulos", async (req, res) => {
  try {
    const modulos = await prisma.modulo.findMany();
    res.json(modulos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener módulos" });
  }
});
app.get("/modulos/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    console.log("🧪 Buscando módulo con ID:", id);
    const modulo = await prisma.modulo.findUnique({ where: { id } });

    if (!modulo) return res.status(404).json({ error: "Módulo no encontrado" });

    res.json(modulo);
  } catch (error) {
    console.error("❌ Error exacto:", error);
    res.status(500).json({ error: "Error al obtener Módulo" });
  }
});
app.get("/facturas/por-presupuesto/:presupuestoId", async (req, res) => {
  const presupuestoId = parseInt(req.params.presupuestoId);

  console.log("📥 Buscando facturas con presupuestoId =", presupuestoId);

  if (isNaN(presupuestoId)) {
    return res.status(400).json({ error: "ID de presupuesto no válido" });
  }

  try {
    // ✅ Usar el modelo correcto 'facturas' (plural)
    const facturas = await prisma.facturas.findMany({
      where: { presupuestoId },
      orderBy: { createdAt: "desc" },
      include: {
        presupuesto: {
          select: {
            descripcion: true,
            nombre: true,
            importe: true,
          },
        },
      },
    });

    console.log("🧾 Facturas encontradas:", facturas.length);
    res.json(facturas);
  } catch (error) {
    console.error("❌ Error al buscar facturas:", error);
    res.status(500).json({
      error: "Error al obtener facturas del presupuesto",
      detalle: error.message,
    });
  }
});
app.get("/roles", async (req, res) => {
  try {
    const roles = await prisma.rol.findMany({
      orderBy: { nombre: "asc" }, // Orden alfabético
    });

    res.status(200).json(roles);
  } catch (error) {
    console.error("❌ Error al obtener roles:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});
app.get("/roles/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // ✅ Validar que el ID sea un número entero
    const rolId = parseInt(id);
    if (isNaN(rolId)) {
      return res.status(400).json({
        error: "ID de rol inválido",
        detalles: "El ID debe ser un número válido",
      });
    }

    console.log(`🔍 Buscando rol con ID: ${rolId} (Int)`);

    // ✅ Buscar el rol en la base de datos usando ID entero
    const rol = await prisma.rol.findUnique({
      where: {
        id: rolId, // ✅ Usar como entero
      },
    });

    // ✅ Verificar si el rol existe
    if (!rol) {
      return res.status(404).json({
        error: "Rol no encontrado",
        detalles: `No existe un rol con ID ${rolId}`,
      });
    }

    // ✅ Log para debugging
    console.log(`✅ Rol ${rolId} encontrado:`, {
      id: rol.id,
      nombre: rol.nombre,
      tienePermisos: !!rol.permisos,
    });

    // ✅ Convertir permisos de JSON a string para el frontend
    const rolParaFrontend = {
      ...rol,
      permisos: JSON.stringify(rol.permisos), // ✅ Convertir JSON a string
    };

    res.json(rolParaFrontend);
  } catch (error) {
    console.error("❌ Error al obtener rol:", error);

    res.status(500).json({
      error: "Error interno del servidor",
      detalles: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});
app.get("/roles/:id/usuarios", async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID de rol inválido" });
  }

  try {
    const usuarios = await prisma.usuario.findMany({
      where: { rolId: id },
      select: {
        id: true,
        idUsuario: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        activo: true,
      },
      orderBy: { nombre: "asc" },
    });

    res.json(usuarios);
  } catch (error) {
    console.error("❌ Error al obtener usuarios por rol:", error);
    res.status(500).json({ error: "Error al obtener usuarios del rol" });
  }
});

// GET /kpis/obras
app.get("/kpis/obras", async (req, res) => {
  try {
    const [
      totalObras,
      obrasActivas,
      tareasHoy,
      tareasSemana,
      obrasPorEstado,
      obrasPorMes,
      avanceMedio,
      importeTotalPresupuestado,
    ] = await Promise.all([
      prisma.obra.count(),
      prisma.obra.count({
        where: { estado: { notIn: ["Finalizada", "Cerrada"] } },
      }),
      prisma.tarea.count({
        where: {
          estado: { notIn: ["Completada", "Cancelada"] },
          fechaInicio: { lte: new Date() },
          fechaFin: { gte: new Date() },
        },
      }),
      (async () => {
        const hoy = new Date();
        const end = new Date(hoy);
        // domingo de esta semana (o +7 días)
        end.setDate(hoy.getDate() + (7 - hoy.getDay()));
        return prisma.tarea.count({
          where: {
            estado: { notIn: ["Completada", "Cancelada"] },
            fechaInicio: { gte: hoy, lte: end },
          },
        });
      })(),
      prisma.obra.groupBy({ by: ["estado"], _count: { _all: true } }),
      prisma.$queryRaw`
        SELECT to_char(date_trunc('month',"createdAt"), 'YYYY-MM') as mes, COUNT(*)::int as total
        FROM "Obra"
        WHERE "createdAt" >= (CURRENT_DATE - INTERVAL '12 months')
        GROUP BY 1 ORDER BY 1 ASC;
      `,
      prisma.$queryRaw`SELECT COALESCE(AVG("avance"::numeric),0)::float as promedio FROM "Obra";`,
      prisma.$queryRaw`SELECT COALESCE(SUM("importe"::numeric),0)::float as total FROM "Presupuesto";`,
    ]);

    res.json({
      totalObras,
      obrasActivas,
      tareasPendientesHoy: tareasHoy,
      tareasPendientesSemana: tareasSemana,
      obrasPorEstado: obrasPorEstado.map((o) => ({
        estado: o.estado,
        total: o._count._all,
      })),
      obrasPorMes,
      avanceMedio: Number(avanceMedio?.[0]?.promedio ?? 0),
      importeTotalPresupuestado: Number(
        importeTotalPresupuestado?.[0]?.total ?? 0
      ),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error calculando KPIs" });
  }
});

// GET ME

app.get("/directorio/me", requireAuth, async (req, res) => {
  try {
    const idUsuario = req.user.id;

    const perfil = await prisma.usuario.findUnique({
      where: { idUsuario }, // 👈 ajusta si tu PK es 'id'
      select: {
        idUsuario: true,
        email: true,
        nombre: true,
        apellidos: true,
        rol: true,
        // ⚠️ Cambia 'directorioEmpleado' por el nombre real de tu relación en Prisma
        directorioEmpleado: {
          select: {
            telefono: true,
            puesto: true,
            tipo: true, // enum "INTERNO" | "EXTERNO" si lo usas
            avatarUrl: true,
            ubicacion: true,
            extension: true,
          },
        },
      },
    });

    if (!perfil)
      return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(perfil);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al cargar perfil" });
  }
});

//////////////////////////////////////////////////////////
//  POST
//////////////////////////////////////////////////////////
app.post("/obras", async (req, res) => {
  const { nombre, direccion, fechaInicio, fechaFin, estadoId, clienteId } =
    req.body;

  if (
    !nombre ||
    !direccion ||
    !fechaInicio ||
    !fechaFin ||
    !estadoId ||
    !clienteId
  ) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  if (isNaN(Number(clienteId))) {
    return res.status(400).json({ error: "clienteId no válido" });
  }

  try {
    const nuevaObra = await prisma.obra.create({
      data: {
        nombre,
        direccion,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        estadoId: Number(estadoId),
        clienteId: Number(clienteId), // ✅ conversión segura
      },
    });

    res.status(201).json(nuevaObra);
  } catch (error) {
    console.error("[POST /obras] Error al crear obra:", error.message);
    res
      .status(500)
      .json({ error: "Error al crear la obra", detalle: error.message });
  }
});
app.post("/estados", async (req, res) => {
  try {
    const { nombre, color, icono } = req.body;

    if (!nombre || !color || !icono) {
      return res.status(400).json({ error: "Faltan campos obligatorios." });
    }

    const nuevoEstado = await prisma.estados.create({
      data: {
        nombre,
        color,
        icono,
      },
    });

    res.status(201).json(nuevoEstado);
  } catch (error) {
    console.error("Error al crear estado:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});
app.post("/clientes", async (req, res) => {
  const { nombre, apellido, direccion, email, telefono, dni } = req.body;

  if (!nombre || !apellido || !direccion || !email || !telefono) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    const nuevoCliente = await prisma.cliente.create({
      data: {
        nombre,
        apellido,
        direccion,
        email,
        telefono,
        dni,
      },
    });
    res.status(201).json(nuevoCliente);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Error al crear el cliente", detalle: error.message });
  }
});
app.post("/servicios", async (req, res) => {
  try {
    const { nombre, color, icono } = req.body;

    if (!nombre || !color || !icono) {
      return res.status(400).json({ error: "Faltan campos obligatorios." });
    }

    const nuevoServicio = await prisma.servicios.create({
      data: {
        nombre,
        color,
        icono,
      },
    });

    res.status(201).json(nuevoServicio);
  } catch (error) {
    console.error("Error al crear servicio:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});
app.post("/obras/tareas", async (req, res) => {
  const { nombre, descripcion, estadoId, progreso } = req.body;

  try {
    const nuevaTarea = await prisma.tareas.create({
      data: {
        nombre,
        descripcion,
        estadoId,
        progreso,
      },
    });
    res.status(201).json(nuevaTarea);
  } catch (err) {
    res.status(500).json({ error: "Error al crear tarea", detalle: err });
  }
});
app.post("/servicios_tarea", async (req, res) => {
  const {
    obraId,
    servicioId,
    tareaId, // puede llegar vacío o undefined
    fechaInicio,
    fechaFin,
    precioManoObra,
    precioMateriales,
    cantidadMateriales,
    total,
  } = req.body;

  if (!obraId || !servicioId) {
    return res
      .status(400)
      .json({ error: "obraId y servicioId son obligatorios" });
  }

  try {
    let tareaCreadaId = tareaId;

    // 🔹 Si no se pasó una tareaId, creamos una automáticamente
    if (!tareaId) {
      const nuevaTarea = await prisma.tarea.create({
        data: {
          nombre: "Tarea sin título",
          descripcion: "",
          estadoId: null,
          fechaInicio: null,
          fechaFin: null,
        },
      });

      tareaCreadaId = nuevaTarea.id;
    }

    const nuevo = await prisma.servicios_Tarea.create({
      data: {
        obraId: Number(obraId),
        servicioId: Number(servicioId),
        tareaId: Number(tareaCreadaId),
        fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
        fechaFin: fechaFin ? new Date(fechaFin) : undefined,
        precioManoObra: precioManoObra ? parseFloat(precioManoObra) : undefined,
        precioMateriales: precioMateriales
          ? parseFloat(precioMateriales)
          : undefined,
        cantidadMateriales: cantidadMateriales
          ? parseFloat(cantidadMateriales)
          : undefined,
        total: total ? parseFloat(total) : undefined,
      },
      include: {
        tarea: true, // para que el frontend tenga el nombre desde el principio
      },
    });

    res.status(201).json(nuevo);
  } catch (err) {
    console.error("❌ Error al crear servicios_tarea:", err);
    res.status(500).json({
      error: "Error al vincular servicio con tarea",
      detalle: err.message,
    });
  }
});
app.post("/materiales", async (req, res) => {
  const { nombre, descripcion, precio, proveedor, stockActual, unidadMedida } =
    req.body;

  // Validación de campos obligatorios
  if (!nombre || !descripcion || !proveedor || isNaN(Number(precio))) {
    return res
      .status(400)
      .json({ error: "Faltan campos obligatorios o precio no válido" });
  }

  try {
    const nuevoMaterial = await prisma.materiales.create({
      data: {
        nombre,
        descripcion,
        precio: Number(precio),
        proveedor,
        stockActual: stockActual ? Number(stockActual) : null,
        unidadMedida: unidadMedida || null,
      },
    });

    res.status(201).json(nuevoMaterial);
  } catch (error) {
    console.error("❌ Error al crear material:", error);
    res.status(500).json({
      error: "Error interno al crear el material",
      detalle: error.message,
    });
  }
});
app.post("/modulos", async (req, res) => {
  try {
    const { nombre, ruta, icono, orden, padreId } = req.body;

    if (!nombre) {
      return res
        .status(400)
        .json({ error: 'El campo "nombre" es obligatorio.' });
    }

    const nuevoModulo = await prisma.modulo.create({
      data: {
        nombre,
        ruta,
        icono,
        orden,
        padreId: padreId ?? null,
      },
    });

    res.status(201).json(nuevoModulo);
  } catch (error) {
    console.error("Error al crear modulos:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});
app.post("/roles", async (req, res) => {
  const { nombre, descripcion, nivel, activo, permisos } = req.body;

  // Validación de campos obligatorios
  if (!nombre) {
    return res.status(400).json({ error: "El campo 'nombre' es obligatorio" });
  }

  try {
    // Verificar que no exista un rol con el mismo nombre
    const rolExistente = await prisma.rol.findFirst({
      where: {
        nombre: {
          equals: nombre,
          mode: "insensitive", // Búsqueda case-insensitive
        },
      },
    });

    if (rolExistente) {
      return res.status(400).json({
        error: "Ya existe un rol con ese nombre",
      });
    }

    const nuevoRol = await prisma.rol.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        nivel: nivel ? parseInt(nivel) : null,
        activo: typeof activo === "boolean" ? activo : true,
        permisos: permisos || null,
      },
    });

    res.status(201).json(nuevoRol);
  } catch (error) {
    console.error("❌ Error al crear rol:", error);

    if (error.code === "P2002") {
      return res.status(400).json({
        error: "Ya existe un rol con ese nombre",
      });
    }

    res.status(500).json({
      error: "Error interno al crear el rol",
      detalle: error.message,
    });
  }
});
app.post("/presupuestos", async (req, res) => {
  const { clienteId, obraId, nombre, descripcion, condiciones } = req.body;

  try {
    console.log("🟢 Iniciando creación de presupuesto");
    console.log("📥 Datos recibidos:", {
      clienteId,
      obraId,
      nombre,
      descripcion,
      condiciones,
    });

    // ✅ Validaciones básicas
    if (!clienteId || !obraId || !descripcion) {
      return res.status(400).json({
        error: "Faltan campos obligatorios: clienteId, obraId, descripcion",
      });
    }

    // 1️⃣ Buscar todos los servicios_tarea relacionados con la obra
    const serviciosTarea = await prisma.servicios_Tarea.findMany({
      where: { obraId: Number(obraId) },
      include: {
        servicio: true,
        tarea: true,
        stMateriales: {
          include: {
            material: true,
          },
        },
      },
    });

    console.log("🔍 Servicios_Tarea encontrados:", serviciosTarea.length);

    // 2️⃣ Calcular base imponible
    const baseImponible = serviciosTarea.reduce(
      (acc, st) => acc + (st.total || 0),
      0
    );
    const importe = parseFloat((baseImponible * 1.21).toFixed(2));

    console.log("💰 Base imponible:", baseImponible, "Importe final:", importe);

    // 3️⃣ Crear el presupuesto - ✅ CORREGIR CAMPO "descripción"
    const nuevoPresupuesto = await prisma.presupuesto.create({
      data: {
        clienteId: Number(clienteId),
        obraId: Number(obraId),
        nombre: nombre || "Presupuesto sin nombre",
        descripcion: descripcion, // ✅ SIN TILDE - debe coincidir con el schema
        importe,
        condiciones: condiciones || null,
      },
    });

    console.log("✅ Presupuesto creado:", nuevoPresupuesto.id);

    // 4️⃣ Crear snapshot de servicios y tareas
    const serviciosUnicos = [
      ...new Set(serviciosTarea.map((st) => st.servicioId)),
    ];

    console.log("📋 Servicios únicos a procesar:", serviciosUnicos.length);

    for (const servicioId of serviciosUnicos) {
      const tareasServicio = serviciosTarea.filter(
        (st) => st.servicioId === servicioId
      );
      const nombreServicio =
        tareasServicio[0]?.servicio?.nombre || "Servicio sin nombre";

      console.log("➕ Añadiendo servicio:", nombreServicio);

      // ✅ Crear servicio en presupuesto
      const servicioPresupuesto = await prisma.presupuesto_Servicio.create({
        data: {
          presupuestoId: nuevoPresupuesto.id,
          servicioId: Number(servicioId),
          nombre: nombreServicio,
        },
      });

      // ✅ Procesar tareas del servicio
      for (const st of tareasServicio) {
        const nombreTarea = st.tarea?.nombre || "Tarea sin nombre";
        console.log("  ↪ Añadiendo tarea:", nombreTarea);

        const tareaPresupuesto = await prisma.presupuesto_Tarea.create({
          data: {
            presupuestoServicioId: servicioPresupuesto.id,
            tareaId: st.tarea?.id || null,
            nombre: nombreTarea,
            descripcion: st.tarea?.descripcion || "Sin descripción",
            precioManoObra: st.precioManoObra || 0,
            total: st.total || 0,
            cantidad: st.cantidadMateriales || 1,
            totalMateriales: st.precioMateriales || 0,
          },
        });

        // ✅ Procesar materiales de la tarea
        for (const stMat of st.stMateriales || []) {
          const nombreMaterial =
            stMat.material?.nombre || "Material sin nombre";
          console.log("    ↪ Añadiendo material:", nombreMaterial);

          await prisma.presupuesto_Material.create({
            data: {
              presupuestoTareaId: tareaPresupuesto.id,
              nombre: nombreMaterial,
              cantidad: stMat.cantidad || 0,
              precioUnidad: stMat.preciounidad || 0,
              total: stMat.total || 0,
              facturable: stMat.facturable || false,
            },
          });
        }
      }
    }

    console.log(
      "🎉 Presupuesto creado exitosamente con ID:",
      nuevoPresupuesto.id
    );
    res.status(201).json(nuevoPresupuesto);
  } catch (error) {
    console.error("❌ Error detallado al crear presupuesto:", error);
    console.error("❌ Stack trace:", error.stack);

    // ✅ Respuesta de error más detallada
    res.status(500).json({
      error: "Error al crear el presupuesto",
      detalle: error.message,
      codigo: error.code,
    });
  }
});
app.post("/st_material", async (req, res) => {
  const {
    ServicioTareaId,
    materialesId,
    cantidad,
    preciounidad,
    total,
    facturable,
  } = req.body;

  // Validación mínima
  if (
    !ServicioTareaId ||
    !materialesId ||
    !cantidad ||
    !preciounidad ||
    !total
  ) {
    return res.status(400).json({ error: "Faltan campos obligatorios." });
  }

  try {
    const nuevo = await prisma.sT_Material.create({
      data: {
        ServicioTareaId: Number(ServicioTareaId),
        materialesId: Number(materialesId),
        cantidad: Number(cantidad),
        preciounidad: Number(preciounidad),
        total: Number(total),
        facturable: Boolean(facturable),
      },
    });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error("❌ Error al crear ST_Material:", error);
    res
      .status(500)
      .json({ error: "Error al crear ST_Material", detalle: error.message });
  }
});
app.post("/branding", async (req, res) => {
  const {
    nombre,
    CIF,
    direccion,
    codigoPostal,
    localidad,
    provincia,
    telefono,
    email,
    web,
    logoUrl,
    colorGeneral,
    colorPDF,
    CondicionesPresupuesto,
    firma,
    condiciones,
  } = req.body;

  try {
    // Opcional: evitar duplicados si solo debe haber un registro
    const existe = await prisma.branding.findFirst();
    if (existe) {
      return res
        .status(400)
        .json({ error: "Ya existe un branding registrado." });
    }

    const nuevo = await prisma.branding.create({
      data: {
        nombre,
        CIF,
        direccion,
        codigoPostal,
        localidad,
        provincia,
        telefono,
        email,
        web,
        logoUrl,
        colorGeneral,
        colorPDF,
        CondicionesPresupuesto,
        firma,
        condiciones,
      },
    });

    res.json(nuevo);
  } catch (error) {
    console.error("❌ Error al crear branding:", error);
    res.status(500).json({ error: "Error al crear branding" });
  }
});
app.post("/usuarios", async (req, res) => {
  const {
    nombre,
    apellido,
    email,
    telefono,
    password,
    rolId,
    activo,
    idUsuario,
  } = req.body;

  if (!email || !password || !nombre) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente)
      return res
        .status(400)
        .json({ error: "Ya existe un usuario con ese email" });

    const passwordHash = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        idUsuario,
        nombre,
        apellido,
        email,
        telefono,
        passwordHash,
        rolId,
        activo,
      },
    });

    res.status(201).json({
      mensaje: "Usuario creado con éxito",
      usuario: { id: nuevoUsuario.id, email: nuevoUsuario.email },
    });
  } catch (error) {
    console.error("Error creando usuario:", error);
    res.status(500).json({ error: "Error al crear usuario" });
  }
});
app.post("/directorios", async (req, res) => {
  try {
    const {
      // ⇩ del body (muchos pueden venir vacíos como '')
      tipo,
      estado,
      nombre,
      apellidos,
      displayName,
      dni,
      email,
      emailPersonal,
      telefono,
      telefono2,
      fotoUrl,
      puesto,
      departamentoId,
      supervisorId,
      rol,
      jornada,
      turno,
      empresaExternaId,
      usuarioId,
      calendarEmail,
      costeHora,
      tarifaFacturacionHora,
      moneda,
      capacidadSemanalHoras,
      tienePRL,
      prlVencimiento,
      rcVigente,
      rcVencimiento,
      ubicacionCiudad,
      ubicacionProvincia,
      ubicacionPais,
      fechaBaja,
      observaciones,
      tags,
      // id, subordinados, fechaAlta (no usamos: cuid() + defaults)
    } = req.body;

    // 1) Obligatorios mínimos
    if (!nombre || !apellidos || !email) {
      return res.status(400).json({
        error: "Faltan campos obligatorios: nombre, apellidos, email",
      });
    }

    // 2) Normalizaciones (evitar "" en únicos, enteros y decimales)
    const usuarioIdParsed = toIntOrNull(usuarioId); // Int o null
    const capacidadSemanalHorasParsed = toIntOrNull(capacidadSemanalHoras);
    const dniNorm = toNullableString(dni); // "" -> null (evita duplicado de cadena vacía)
    const costeHoraNorm = toDecimalStringOrNull(costeHora); // "" -> null; "222" ok
    const tarifaHoraNorm = toDecimalStringOrNull(tarifaFacturacionHora);
    const departamentoIdNorm = toNullableString(departamentoId);
    const supervisorIdNorm = toIntOrNull(supervisorId);
    const empresaExternaIdNorm = toNullableString(empresaExternaId);
    const monedaNorm = toNullableString(moneda); // undefined respeta default("EUR")
    const tienePRLBool = toBoolOrUndefined(tienePRL);
    const rcVigenteBool = toBoolOrUndefined(rcVigente);
    const estadoBool = toBoolOrUndefined(estado);

    // 3) Unicidades
    const existeEmail = await prisma.directorios.findUnique({
      where: { email },
    });
    if (existeEmail)
      return res
        .status(409)
        .json({ error: "Ya existe un directorio con ese email" });

    if (dniNorm) {
      const existeDni = await prisma.directorios.findUnique({
        where: { dni: dniNorm },
      });
      if (existeDni)
        return res
          .status(409)
          .json({ error: "Ya existe un directorio con ese DNI" });
    }

    // 4) Verificación de FKs (evita P2003)
    if (usuarioIdParsed !== null) {
      const userOK = await prisma.usuario.findUnique({
        where: { id: usuarioIdParsed },
        select: { id: true },
      });
      if (!userOK)
        return res.status(400).json({ error: "usuarioId no existe" });

      // 1:1 — que no esté ya vinculado
      const yaVinculado = await prisma.directorios.findFirst({
        where: { usuarioId: usuarioIdParsed },
        select: { id: true },
      });
      if (yaVinculado)
        return res
          .status(409)
          .json({ error: "Ese usuario ya tiene un directorio vinculado" });
    }

    if (supervisorIdNorm) {
      const supOK = await prisma.directorios.findUnique({
        where: { id: supervisorIdNorm },
        select: { id: true },
      });
      if (!supOK)
        return res.status(400).json({ error: "supervisorId no existe" });
    }
    if (departamentoIdNorm) {
      const depOK = await prisma.departamento.findUnique({
        where: { id: departamentoIdNorm },
        select: { id: true },
      });
      if (!depOK)
        return res.status(400).json({ error: "departamentoId no existe" });
    }
    if (empresaExternaIdNorm) {
      const empOK = await prisma.empresaExterna.findUnique({
        where: { id: empresaExternaIdNorm },
        select: { id: true },
      });
      if (!empOK)
        return res.status(400).json({ error: "empresaExternaId no existe" });
    }

    // 5) Crear (sin id del body, para usar cuid())
    const nuevo = await prisma.directorios.create({
      data: {
        tipo: toNullableString(tipo),
        estado: estadoBool, // undefined → respeta default; null guardaría null

        nombre,
        apellidos,
        displayName: toNullableString(displayName),

        dni: dniNorm,
        email,
        emailPersonal: toNullableString(emailPersonal),
        telefono: toNullableString(telefono),
        telefono2: toNullableString(telefono2),
        fotoUrl: toNullableString(fotoUrl),

        puesto: toNullableString(puesto),
        departamentoId: departamentoIdNorm,
        supervisorId: supervisorIdNorm,

        rol: toNullableString(rol),
        jornada: toNullableString(jornada),
        turno: toNullableString(turno),

        empresaExternaId: empresaExternaIdNorm,

        usuarioId: usuarioIdParsed, // Int|null

        calendarEmail: toNullableString(calendarEmail),

        costeHora: costeHoraNorm, // string|null (Decimal)
        tarifaFacturacionHora: tarifaHoraNorm,
        moneda: monedaNorm === null ? undefined : monedaNorm, // undefined respeta default("EUR")
        capacidadSemanalHoras: capacidadSemanalHorasParsed,

        tienePRL: tienePRLBool, // undefined respeta default(false)
        prlVencimiento: toNullableString(prlVencimiento)
          ? new Date(prlVencimiento)
          : null,
        rcVigente: rcVigenteBool,
        rcVencimiento: toNullableString(rcVencimiento)
          ? new Date(rcVencimiento)
          : null,

        ubicacionCiudad: toNullableString(ubicacionCiudad),
        ubicacionProvincia: toNullableString(ubicacionProvincia),
        ubicacionPais: toNullableString(ubicacionPais),

        fechaBaja: toNullableString(fechaBaja) ? new Date(fechaBaja) : null,
        observaciones: toNullableString(observaciones),

        tags: Array.isArray(tags) ? tags : [],
      },
      select: { id: true, email: true, usuarioId: true },
    });

    return res
      .status(201)
      .json({ mensaje: "Directorio creado con éxito", directorio: nuevo });
  } catch (error) {
    // Manejo de errores Prisma en JS puro
    if (error && typeof error === "object" && "code" in error) {
      const code = error.code;
      console.error("Prisma code:", code, "meta:", error.meta);
      if (code === "P2002")
        return res
          .status(409)
          .json({ error: "Registro duplicado", meta: error.meta });
      if (code === "P2003")
        return res
          .status(400)
          .json({ error: "FK no válida", meta: error.meta });
      if (code === "P2025")
        return res
          .status(404)
          .json({ error: "Registro no encontrado", meta: error.meta });
    }
    console.error("Error creando directorio:", error);
    return res.status(500).json({ error: "Error al crear directorio" });
  }
});
app.post("/usuarios/:id/directorio", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: "id de usuario inválido" });
    }

    // 1) Cargar usuario + su rol + si ya tiene directorio
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { rol: true, directorio: true },
    });

    if (!usuario)
      return res.status(404).json({ error: "Usuario no encontrado" });
    if (usuario.directorio) {
      return res
        .status(409)
        .json({ error: "Este usuario ya tiene un directorio vinculado" });
    }

    // 2) Prevenir conflicto por email único en Directorios
    const existeEmail = await prisma.directorios.findUnique({
      where: { email: usuario.email },
    });
    if (existeEmail) {
      return res.status(409).json({
        error: "Ya existe un directorio con ese email",
      });
    }

    // 3) Preparar datos
    const rolNombre = usuario.rol?.nombre ?? null;
    const displayName =
      `${usuario.nombre ?? ""} ${usuario.apellido ?? ""}`.trim();

    // 4) Crear Directorio (usa defaults: fechaAlta now, moneda "EUR", etc.)
    const nuevo = await prisma.directorios.create({
      data: {
        estado: true,
        nombre: usuario.nombre,
        apellidos: usuario.apellido,
        email: usuario.email,
        displayName: displayName || null,
        rol: rolNombre, // ← nombre del rol; en Usuario guardas rolId
        usuarioId: usuario.id, // ← 1:1
        // Puedes copiar teléfono si quieres:
        telefono: usuario.telefono ?? null,
        // El resto de campos quedan null/default
        tags: [],
      },
      select: { id: true, email: true, usuarioId: true },
    });

    return res.status(201).json({
      mensaje: "Directorio creado con éxito",
      directorio: nuevo,
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      const code = error.code;
      console.error("Prisma code:", code, "meta:", error.meta);
      if (code === "P2002")
        return res
          .status(409)
          .json({ error: "Campo único duplicado (email/dni/usuarioId)" });
      if (code === "P2003")
        return res.status(400).json({ error: "FK no válida" });
    }
    console.error("[POST /usuarios/:id/directorio] Error:", error);
    return res.status(500).json({ error: "Error al crear directorio" });
  }
});

app.post("/facturas", async (req, res) => {
  const { presupuestoId, cantidad, servicioIds } = req.body;

  try {
    if (!presupuestoId || typeof cantidad !== "number") {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    // Generar referencia
    const facturasExistentes = await prisma.facturas.findMany({
      where: { presupuestoId },
    });
    const nuevaReferencia = `FAC-${presupuestoId}P-${facturasExistentes.length + 1}`;

    // Filtrar solo IDs válidos
    const existentes = servicioIds?.length
      ? await prisma.presupuesto_Servicio.findMany({
          where: { id: { in: servicioIds } },
          select: { id: true },
        })
      : [];

    const nuevaFactura = await prisma.facturas.create({
      data: {
        referencia: nuevaReferencia,
        fecha: new Date(),
        cobrada: false,
        cantidad,
        presupuestoId,
        ...(existentes.length > 0 && {
          servicio: {
            connect: existentes.map(({ id }) => ({ id })),
          },
        }),
      },
    });

    res.status(200).json(nuevaFactura);
  } catch (error) {
    console.error("❌ Error creando factura:", JSON.stringify(error, null, 2));
    res.status(500).json({ message: "Error creando factura" });
  }
});

//////////////////////////////////////////////////////////
//  PUT
//////////////////////////////////////////////////////////

app.put("/roles/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, nivel, activo, permisos } = req.body;

  try {
    // ✅ Validar que el ID sea un número entero
    const rolId = parseInt(id);
    if (isNaN(rolId)) {
      return res.status(400).json({
        error: "ID de rol inválido",
      });
    }

    console.log(`🔍 Actualizando rol con ID: ${rolId} (Int)`);

    // ✅ Validaciones básicas
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        error: "El campo 'nombre' es obligatorio",
      });
    }

    // ✅ Verificar que el rol existe
    const rolExistente = await prisma.rol.findUnique({
      where: { id: rolId },
    });

    if (!rolExistente) {
      return res.status(404).json({
        error: "Rol no encontrado",
        detalles: `No existe un rol con ID ${rolId}`,
      });
    }

    // ✅ Verificar duplicados de nombre (excluyendo el rol actual)
    const nombreDuplicado = await prisma.rol.findFirst({
      where: {
        nombre: {
          equals: nombre.trim(),
          mode: "insensitive",
        },
        NOT: {
          id: rolId,
        },
      },
    });

    if (nombreDuplicado) {
      return res.status(400).json({
        error: "Ya existe otro rol con ese nombre",
      });
    }

    // ✅ Validar y parsear permisos
    let permisosObj = rolExistente.permisos; // Mantener los existentes por defecto

    if (permisos) {
      try {
        permisosObj = JSON.parse(permisos);
        const tieneAlgunPermiso = Object.values(permisosObj).some((modulo) =>
          Object.values(modulo).some(Boolean)
        );

        if (!tieneAlgunPermiso) {
          return res.status(400).json({
            error: "El rol debe tener al menos un permiso asignado",
          });
        }
      } catch (e) {
        return res.status(400).json({
          error: "El formato de permisos no es válido",
        });
      }
    }

    // ✅ Actualizar el rol
    const rolActualizado = await prisma.rol.update({
      where: { id: rolId },
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        nivel: nivel ? parseInt(nivel) : rolExistente.nivel,
        activo: typeof activo === "boolean" ? activo : rolExistente.activo,
        permisos: permisosObj, // ✅ Guardar como JSON
        updatedAt: new Date(),
      },
    });

    // ✅ Log para debugging
    console.log(`✅ Rol ${rolId} actualizado:`, {
      id: rolActualizado.id,
      nombre: rolActualizado.nombre,
      cambios: {
        nombre: rolExistente.nombre !== rolActualizado.nombre,
        nivel: rolExistente.nivel !== rolActualizado.nivel,
        activo: rolExistente.activo !== rolActualizado.activo,
        permisos:
          JSON.stringify(rolExistente.permisos) !==
          JSON.stringify(rolActualizado.permisos),
      },
    });

    // ✅ Convertir permisos a string para el frontend
    const rolParaFrontend = {
      ...rolActualizado,
      permisos: JSON.stringify(rolActualizado.permisos),
    };

    res.json(rolParaFrontend);
  } catch (error) {
    console.error("❌ Error al actualizar rol:", error);

    if (error.code === "P2002") {
      return res.status(400).json({
        error: "Ya existe un rol con ese nombre",
      });
    }

    res.status(500).json({
      error: "Error interno al actualizar el rol",
      detalles: error.message,
    });
  }
});
app.put("/roles/:id/estado", async (req, res) => {
  const id = parseInt(req.params.id);
  const { activo } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  if (typeof activo !== "boolean") {
    return res.status(400).json({
      error: "El campo 'activo' debe ser boolean",
    });
  }

  try {
    // Verificar cuántos usuarios tienen este rol antes de desactivar
    if (!activo) {
      const usuariosConRol = await prisma.usuario.count({
        where: { rolId: id, activo: true },
      });

      if (usuariosConRol > 0) {
        return res.status(400).json({
          error: `No se puede desactivar el rol. Hay ${usuariosConRol} usuarios activos con este rol.`,
          suggestion: "Reasigna los usuarios a otro rol antes de desactivar.",
        });
      }
    }

    const rolActualizado = await prisma.rol.update({
      where: { id },
      data: { activo },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        activo: true,
      },
    });

    res.json(rolActualizado);
  } catch (error) {
    console.error("❌ Error al cambiar estado del rol:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Rol no encontrado" });
    }

    res.status(500).json({
      error: "Error al cambiar estado del rol",
      detalle: error.message,
    });
  }
});
app.put("/clientes/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, apellido, direccion, email, telefono, dni } = req.body;

  if (!nombre || !apellido || !direccion || !email || !telefono || !dni) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    const clienteActualizado = await prisma.cliente.update({
      where: { id },
      data: { nombre, apellido, direccion, email, telefono, dni },
    });
    res.json(clienteActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar cliente" });
  }
});
app.put("/obras/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, direccion, fechaInicio, fechaFin, estado, clienteId } =
    req.body;

  // Validación de campos obligatorios
  if (!nombre || !direccion || !fechaInicio || !fechaFin || !estado) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  // Construimos el objeto de actualización dinámicamente
  const data = {
    nombre,
    direccion,
    fechaInicio: new Date(fechaInicio),
    fechaFin: new Date(fechaFin),
    estado,
  };

  // Solo si clienteId está presente lo añadimos
  if (clienteId) {
    data.clienteId = parseInt(clienteId, 10);
  }

  try {
    const obraActualizada = await prisma.obra.update({
      where: { id },
      data,
    });
    res.json(obraActualizada);
  } catch (error) {
    console.error("[PUT /obras/:id] Error:", error.message);
    res
      .status(500)
      .json({ error: "Error al actualizar obra", detalle: error.message });
  }
});
app.put("/tareas/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, descripcion, estado, progreso, direccion } = req.body;

  if (!id || !nombre) {
    return res
      .status(400)
      .json({ error: "Faltan datos para actualizar la tarea" });
  }

  try {
    const tareaActualizada = await prisma.tareas.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        estado,
        progreso,
        direccion,
      },
    });

    res.json(tareaActualizada);
  } catch (error) {
    console.error("[PUT /tareas/:id] Error al actualizar tarea:", error);
    res
      .status(500)
      .json({ error: "Error al actualizar tarea", detalle: error.message });
  }
});
app.put("/servicios_tarea/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    obraId,
    servicioId,
    tareaId,
    fechaInicio,
    fechaFin,
    usuarioId,
    precioManoObra,
    precioMateriales,
    cantidadMateriales,
    costeResponsable,
    total,
  } = req.body;

  if (!obraId || !servicioId) {
    return res.status(400).json({ error: "Faltan obraId y servicioId" });
  }

  try {
    const actualizado = await prisma.servicios_Tarea.update({
      where: { id },
      data: {
        obraId: Number(obraId),
        servicioId: Number(servicioId),
        tareaId: tareaId ? Number(tareaId) : null,
        usuarioId: usuarioId ? Number(usuarioId) : null,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        precioManoObra: precioManoObra ? parseFloat(precioManoObra) : 0,
        precioMateriales: precioMateriales ? parseFloat(precioMateriales) : 0,
        cantidadMateriales: cantidadMateriales
          ? parseFloat(cantidadMateriales)
          : 0,
        total: total ? parseFloat(total) : 0,
        costeResponsable: costeResponsable || null,
      },
    });

    res.json(actualizado);
  } catch (error) {
    console.error("[PUT /servicios_tarea/:id] ❌ Error:", error);
    res.status(500).json({
      error: "Error al actualizar vinculación servicio",
      detalle: error.message,
    });
  }
});
app.put("/servicios/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, color, icono } = req.body;

  if (!nombre || !color) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    const servicioActualizado = await prisma.servicios.update({
      where: { id },
      data: { nombre, color, icono },
    });
    res.json(servicioActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar cliente" });
  }
});
app.put("/estados/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, color, icono } = req.body;

  if (!nombre || !color) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    const estadoActualizado = await prisma.estados.update({
      where: { id },
      data: { nombre, color, icono },
    });
    res.json(estadoActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar cliente" });
  }
});
app.put("/branding/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const actualizado = await prisma.branding.update({
      where: { id },
      data: req.body,
    });
    res.json(actualizado);
  } catch (error) {
    console.error("❌ Error al actualizar branding:", error);
    res.status(500).json({ error: "Error al actualizar branding" });
  }
});
app.put("/presupuestos/:id", async (req, res) => {
  const id = Number(req.params.id);
  const {
    descripcion,
    importe,
    aceptado,
    ivaPorcentaje,
    descuentoTipo,
    descuentoValor,
    condiciones,
  } = req.body;

  try {
    const actualizado = await prisma.presupuesto.update({
      where: { id },
      data: {
        descripcion,
        importe,
        aceptado,
        ivaPorcentaje,
        descuentoTipo,
        descuentoValor,
        condiciones,
      },
    });
    res.json(actualizado);
  } catch (error) {
    console.error("❌ Error al actualizar presupuesto:", error);
    res.status(500).json({ error: "Error al actualizar presupuesto" });
  }
});
app.put("/materiales/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, descripcion, precio, proveedor, stockActual, unidadMedida } =
    req.body;

  if (!nombre || !descripcion || !proveedor) {
    return res.status(400).json({
      error: "Faltan campos obligatorios: nombre, descripcion, proveedor",
    });
  }

  try {
    const materialActualizado = await prisma.materiales.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        precio: precio ? parseFloat(precio) : 0,
        proveedor,
        stockActual: stockActual ? Number(stockActual) : null,
        unidadMedida: unidadMedida || null,
      },
    });

    res.json(materialActualizado);
  } catch (error) {
    console.error("❌ Error al actualizar material:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Material no encontrado" });
    }

    res.status(500).json({
      error: "Error al actualizar material",
      detalle: error.message,
    });
  }
});
app.put("/modulos/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, ruta, icono, orden, padreId } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: "El campo 'nombre' es obligatorio" });
  }

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID de módulo no válido" });
  }

  try {
    const moduloActualizado = await prisma.modulo.update({
      where: { id },
      data: {
        nombre,
        ruta: ruta || null,
        icono: icono || null,
        orden: orden ? Number(orden) : null,
        padreId: padreId ? Number(padreId) : null,
      },
    });

    res.json(moduloActualizado);
  } catch (error) {
    console.error("[PUT /modulos/:id] Error al actualizar módulo:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Módulo no encontrado" });
    }

    res.status(500).json({
      error: "Error al actualizar módulo",
      detalle: error.message,
    });
  }
});
app.put("/facturas/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    numero,
    descripcion,
    referencia,
    fecha,
    importe,
    estado,
    cobrada,
    cantidad,
    presupuestoId,
  } = req.body;

  console.log("📝 Actualizando factura ID:", id);
  console.log("📥 Datos recibidos:", req.body);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID de factura no válido" });
  }

  // ✅ Validaciones básicas
  if (!referencia) {
    return res.status(400).json({ error: "La referencia es obligatoria" });
  }

  try {
    // ✅ Verificar que la factura existe
    const facturaExistente = await prisma.facturas.findUnique({
      where: { id },
    });

    if (!facturaExistente) {
      return res.status(404).json({ error: "Factura no encontrada" });
    }

    // ✅ Preparar datos para actualizar
    const datosActualizacion = {
      numero: numero || null,
      descripcion: descripcion || null,
      referencia,
      fecha: fecha ? new Date(fecha) : facturaExistente.fecha,
      importe: importe ? parseFloat(importe) : facturaExistente.importe,
      estado: estado || facturaExistente.estado || "pendiente",
      cobrada:
        typeof cobrada === "boolean" ? cobrada : facturaExistente.cobrada,
      cantidad: cantidad ? parseInt(cantidad) : facturaExistente.cantidad,
      presupuestoId: presupuestoId
        ? parseInt(presupuestoId)
        : facturaExistente.presupuestoId,
      updatedAt: new Date(), // ✅ Actualizar timestamp
    };

    console.log("💾 Datos que se van a actualizar:", datosActualizacion);

    // ✅ Actualizar la factura
    const facturaActualizada = await prisma.facturas.update({
      where: { id },
      data: datosActualizacion,
      include: {
        presupuesto: {
          select: {
            descripcion: true,
            nombre: true,
            importe: true,
          },
        },
      },
    });

    console.log("✅ Factura actualizada exitosamente:", facturaActualizada.id);
    res.json(facturaActualizada);
  } catch (error) {
    console.error("❌ Error al actualizar factura:", error);

    // ✅ Manejo de errores específicos de Prisma
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Factura no encontrada" });
    }

    if (error.code === "P2003") {
      return res.status(400).json({
        error: "El presupuestoId proporcionado no existe",
      });
    }

    res.status(500).json({
      error: "Error al actualizar factura",
      detalle: error.message,
      codigo: error.code,
    });
  }
});
app.put("/usuarios/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, apellido, email, telefono, rolId, activo } = req.body;

  if (!nombre || !email) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    // ✅ Verificar que el usuario existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id },
      select: { id: true, email: true, rolId: true },
    });

    if (!usuarioExistente) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // ✅ Verificar email duplicado (excluyendo el usuario actual)
    if (email !== usuarioExistente.email) {
      const emailExistente = await prisma.usuario.findFirst({
        where: {
          email: email,
          NOT: { id: id },
        },
      });

      if (emailExistente) {
        return res.status(400).json({
          error: "Ya existe otro usuario con ese email",
        });
      }
    }

    // ✅ Validar y procesar rolId como entero
    let rolIdFinal = null;

    if (rolId && rolId !== "null" && rolId !== "" && rolId !== "undefined") {
      const rolIdInt = parseInt(rolId);

      if (isNaN(rolIdInt)) {
        return res.status(400).json({
          error: "El rolId debe ser un número válido",
        });
      }

      const rolExistente = await prisma.rol.findUnique({
        where: { id: rolIdInt }, // ✅ rolId como entero
        select: { id: true, nombre: true, activo: true },
      });

      if (!rolExistente) {
        return res.status(400).json({
          error: "El rol especificado no existe",
        });
      }

      if (!rolExistente.activo) {
        return res.status(400).json({
          error: "No se puede asignar un rol inactivo",
        });
      }

      rolIdFinal = rolIdInt;
    }

    // ✅ Preparar datos para actualizar
    const datosActualizacion = {
      nombre,
      apellido: apellido || null,
      email,
      telefono: telefono || null,
      rolId: rolIdFinal, // ✅ Puede ser null o entero
      activo: typeof activo === "boolean" ? activo : true,
      updatedAt: new Date(),
    };

    console.log("📝 Actualizando usuario con datos:", {
      ...datosActualizacion,
      rolIdOriginal: rolId,
      rolIdFinal: rolIdFinal,
    });

    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: datosActualizacion,
      select: {
        id: true,
        idUsuario: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        rolId: true, // ✅ Incluir en respuesta
        activo: true,
        createdAt: true,
        updatedAt: true,
        // ✅ Incluir información del rol asignado (según tu schema se llama 'rol')
        rol: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            nivel: true,
            activo: true,
          },
        },
      },
    });

    // ✅ Log para debugging
    console.log(`✅ Usuario ${id} actualizado:`, {
      id: usuarioActualizado.id,
      email: usuarioActualizado.email,
      rolIdAnterior: usuarioExistente.rolId,
      rolIdNuevo: usuarioActualizado.rolId,
      rolAsignado: usuarioActualizado.rol?.nombre || "Sin rol del sistema",
    });

    res.json(usuarioActualizado);
  } catch (error) {
    console.error("❌ Error al actualizar usuario:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (error.code === "P2002") {
      return res.status(400).json({ error: "Email ya existe" });
    }

    if (error.code === "P2003") {
      return res.status(400).json({
        error: "El rolId proporcionado no es válido",
      });
    }

    res.status(500).json({
      error: "Error al actualizar usuario",
      detalle: error.message,
    });
  }
});
app.put("/directorios/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "id inválido" });

  try {
    const b = req.body;

    const supervisorIdParsed = toIntOrNull(b.supervisorId); // ← ahora INT
    const usuarioIdParsed = toIntOrNull(b.usuarioId); // INT (ya lo era)
    const capacidadParsed = toIntOrNull(b.capacidadSemanalHoras);
    const costeHoraNorm = toDecimalStringOrNull(b.costeHora);
    const tarifaHoraNorm = toDecimalStringOrNull(b.tarifaFacturacionHora);

    if (supervisorIdParsed && supervisorIdParsed === id)
      return res
        .status(400)
        .json({ error: "Un directorio no puede supervisarse a sí mismo" });

    if (supervisorIdParsed !== null) {
      const supOK = await prisma.directorios.findUnique({
        where: { id: supervisorIdParsed },
        select: { id: true },
      });
      if (!supOK)
        return res.status(400).json({ error: "supervisorId no existe" });
    }

    if (usuarioIdParsed !== null) {
      const userOK = await prisma.usuario.findUnique({
        where: { id: usuarioIdParsed },
        select: { id: true },
      });
      if (!userOK)
        return res.status(400).json({ error: "usuarioId no existe" });
      const ocupado = await prisma.directorios.findFirst({
        where: { usuarioId: usuarioIdParsed, NOT: { id } },
        select: { id: true },
      });
      if (ocupado)
        return res
          .status(409)
          .json({ error: "Ese usuario ya tiene un directorio vinculado" });
    }

    const data = {
      ...(b.nombre !== undefined && { nombre: b.nombre }),
      ...(b.apellidos !== undefined && { apellidos: b.apellidos }),
      ...(b.email !== undefined && { email: b.email }),
      ...(b.tipo !== undefined && { tipo: toNullableString(b.tipo) }),
      ...(b.displayName !== undefined && {
        displayName: toNullableString(b.displayName),
      }),
      ...(b.dni !== undefined && { dni: toNullableString(b.dni) }),
      ...(b.emailPersonal !== undefined && {
        emailPersonal: toNullableString(b.emailPersonal),
      }),
      ...(b.telefono !== undefined && {
        telefono: toNullableString(b.telefono),
      }),
      ...(b.telefono2 !== undefined && {
        telefono2: toNullableString(b.telefono2),
      }),
      ...(b.fotoUrl !== undefined && { fotoUrl: toNullableString(b.fotoUrl) }),
      ...(b.puesto !== undefined && { puesto: toNullableString(b.puesto) }),
      ...(b.rol !== undefined && { rol: toNullableString(b.rol) }),
      ...(b.jornada !== undefined && { jornada: toNullableString(b.jornada) }),
      ...(b.turno !== undefined && { turno: toNullableString(b.turno) }),
      ...(b.calendarEmail !== undefined && {
        calendarEmail: toNullableString(b.calendarEmail),
      }),

      // FKs: departamentoId y empresaExternaId SIGUEN siendo String (no tocar)
      ...(b.departamentoId !== undefined && {
        departamentoId: toNullableString(b.departamentoId),
      }),
      ...(b.empresaExternaId !== undefined && {
        empresaExternaId: toNullableString(b.empresaExternaId),
      }),

      // Self-relation INT
      ...(b.supervisorId !== undefined && { supervisorId: supervisorIdParsed }),

      // 1:1 Usuario INT
      ...(b.usuarioId !== undefined && { usuarioId: usuarioIdParsed }),

      // Números / Decimales
      ...(b.capacidadSemanalHoras !== undefined && {
        capacidadSemanalHoras: capacidadParsed,
      }),
      ...(b.costeHora !== undefined && { costeHora: costeHoraNorm }),
      ...(b.tarifaFacturacionHora !== undefined && {
        tarifaFacturacionHora: tarifaHoraNorm,
      }),
      ...(b.moneda !== undefined && { moneda: toNullableString(b.moneda) }),

      // Booleans
      ...(b.estado !== undefined && { estado: !!b.estado }),
      ...(b.tienePRL !== undefined && { tienePRL: !!b.tienePRL }),
      ...(b.rcVigente !== undefined && { rcVigente: !!b.rcVigente }),

      // Fechas
      ...(b.prlVencimiento !== undefined && {
        prlVencimiento: b.prlVencimiento ? new Date(b.prlVencimiento) : null,
      }),
      ...(b.rcVencimiento !== undefined && {
        rcVencimiento: b.rcVencimiento ? new Date(b.rcVencimiento) : null,
      }),
      ...(b.fechaBaja !== undefined && {
        fechaBaja: b.fechaBaja ? new Date(b.fechaBaja) : null,
      }),

      // Arrays
      ...(b.tags !== undefined && {
        tags: Array.isArray(b.tags) ? b.tags : [],
      }),
    };

    const updated = await prisma.directorios.update({ where: { id }, data });
    return res.json(updated);
  } catch (error) {
    console.error("❌ Error al actualizar:", error);
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2025")
        return res.status(404).json({ error: "Directorio no encontrado" });
      if (error.code === "P2002")
        return res
          .status(409)
          .json({ error: "Campo único duplicado (email/dni/usuarioId)" });
      if (error.code === "P2003")
        return res.status(400).json({ error: "FK no válida" });
    }
    return res.status(500).json({ error: "Error al actualizar directorio" });
  }
});

app.put("/st_material/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    ServicioTareaId,
    materialesId,
    cantidad,
    preciounidad,
    total,
    facturable,
  } = req.body;

  if (!ServicioTareaId || !materialesId || !cantidad || !preciounidad) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    const stMaterialActualizado = await prisma.sT_Material.update({
      where: { id },
      data: {
        ServicioTareaId: Number(ServicioTareaId),
        materialesId: Number(materialesId),
        cantidad: Number(cantidad),
        preciounidad: Number(preciounidad),
        total: total ? Number(total) : Number(cantidad) * Number(preciounidad),
        facturable: typeof facturable === "boolean" ? facturable : true,
      },
      include: {
        material: true,
      },
    });

    res.json(stMaterialActualizado);
  } catch (error) {
    console.error("❌ Error al actualizar ST_Material:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "ST_Material no encontrado" });
    }

    if (error.code === "P2003") {
      return res
        .status(400)
        .json({ error: "ServicioTareaId o materialesId no válido" });
    }

    res.status(500).json({
      error: "Error al actualizar ST_Material",
      detalle: error.message,
    });
  }
});
app.put("/usuarios/:id/password", async (req, res) => {
  const id = parseInt(req.params.id);
  const { passwordActual, passwordNueva } = req.body;

  if (!passwordActual || !passwordNueva) {
    return res
      .status(400)
      .json({ error: "Se requieren password actual y nueva" });
  }

  try {
    // Verificar usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: { id: true, passwordHash: true },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar password actual
    const passwordValida = await bcrypt.compare(
      passwordActual,
      usuario.passwordHash
    );
    if (!passwordValida) {
      return res.status(401).json({ error: "Password actual incorrecta" });
    }

    // Hashear nueva password
    const nuevaPasswordHash = await bcrypt.hash(passwordNueva, 10);

    // Actualizar
    await prisma.usuario.update({
      where: { id },
      data: { passwordHash: nuevaPasswordHash },
    });

    res.json({ mensaje: "Password actualizada correctamente" });
  } catch (error) {
    console.error("❌ Error al cambiar password:", error);
    res.status(500).json({
      error: "Error al cambiar password",
      detalle: error.message,
    });
  }
});
app.put("/usuarios/:id/estado", async (req, res) => {
  const id = parseInt(req.params.id);
  const { activo } = req.body;

  if (typeof activo !== "boolean") {
    return res
      .status(400)
      .json({ error: "El campo 'activo' debe ser boolean" });
  }

  try {
    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: { activo },
      select: {
        id: true,
        nombre: true,
        email: true,
        activo: true,
      },
    });

    res.json(usuarioActualizado);
  } catch (error) {
    console.error("❌ Error al cambiar estado usuario:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.status(500).json({
      error: "Error al cambiar estado del usuario",
      detalle: error.message,
    });
  }
});
//////////////////////////////////////////////////////////
//  DELETE
//////////////////////////////////////////////////////////

app.delete("/roles/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // ✅ Verificar si hay usuarios que dependen de este rol
    const usuariosConRol = await prisma.usuario.count({
      where: { rolId: id }, // ✅ Usar como string
    });

    if (usuariosConRol > 0) {
      return res.status(400).json({
        error: `No se puede eliminar el rol. Hay ${usuariosConRol} usuarios asignados a este rol.`,
        suggestion: "Reasigna los usuarios a otro rol antes de eliminar.",
      });
    }

    // ✅ Verificar que no sea un rol del sistema (opcional)
    const rol = await prisma.rol.findUnique({
      where: { id: id }, // ✅ Usar como string
      select: { nombre: true },
    });

    if (!rol) {
      return res.status(404).json({ error: "Rol no encontrado" });
    }

    // Prevenir eliminación de roles críticos del sistema
    const rolesSistema = ["admin", "administrador", "superadmin"];
    if (rolesSistema.includes(rol.nombre.toLowerCase())) {
      return res.status(400).json({
        error: "No se puede eliminar un rol del sistema",
        suggestion: "Desactiva el rol en lugar de eliminarlo.",
      });
    }

    await prisma.rol.delete({ where: { id: id } }); // ✅ Usar como string

    res.json({
      mensaje: "Rol eliminado correctamente",
      rolEliminado: rol.nombre,
    });
  } catch (error) {
    console.error("❌ Error al eliminar rol:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Rol no encontrado" });
    }

    if (error.code === "P2003") {
      return res.status(400).json({
        error: "No se puede eliminar el rol porque tiene usuarios asignados",
      });
    }

    res.status(500).json({
      error: "Error al eliminar rol",
      detalle: error.message,
    });
  }
});
app.delete("/roles/all", async (req, res) => {
  try {
    // Verificar que no haya usuarios con roles asignados
    const usuariosConRoles = await prisma.usuario.count({
      where: { rolId: { not: null } },
    });

    if (usuariosConRoles > 0) {
      return res.status(400).json({
        error: `No se pueden eliminar todos los roles. Hay ${usuariosConRoles} usuarios con roles asignados.`,
        suggestion: "Elimina o reasigna todos los usuarios primero.",
      });
    }

    await prisma.rol.deleteMany();

    res.json({
      mensaje: "✅ Todos los roles eliminados correctamente",
    });
  } catch (error) {
    console.error("[DELETE /roles/all]", error);
    res.status(500).json({ error: "Error al eliminar todos los roles" });
  }
});
app.delete("/clientes/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await prisma.cliente.delete({ where: { id } });
    res.json({ mensaje: "Cliente eliminado correctamente" });
  } catch (error) {
    console.error("[❌ ERROR al eliminar cliente]:", error.message);
    res
      .status(500)
      .json({ error: "Error al eliminar cliente", detalle: error.message });
  }
});
app.delete("/obras/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await prisma.obra.delete({ where: { id } });
    res.json({ mensaje: "Obra eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar obra" });
  }
});
app.delete("/eliminar-todo", async (req, res) => {
  try {
    // Orden importante: borra primero lo que depende de otras tablas
    await prisma.servicios_Tarea.deleteMany();
    await prisma.obra.deleteMany();
    await prisma.cliente.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.tareas.deleteMany();
    await prisma.servicios.deleteMany();
    await prisma.materiales.deleteMany();

    res.json({ mensaje: "✅ Todas las tablas fueron vaciadas correctamente" });
  } catch (error) {
    console.error("[DELETE /eliminar-todo]", error);
    res.status(500).json({ error: "Error al eliminar todos los datos" });
  }
});
app.delete("/modulos/all", async (req, res) => {
  try {
    await prisma.modulo.deleteMany();

    res.json({ mensaje: "✅ Todas los modulos se eliminaron correctamente" });
  } catch (error) {
    console.error("[DELETE /modulos/all]", error);
    res.status(500).json({ error: "Error al eliminar todos los datos" });
  }
});
app.delete("/obras/tareas/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    // Primero borra el registro en servicios_Tarea que usa tareaId como FK
    await prisma.servicios_Tarea.deleteMany({ where: { tareaId: id } });

    // Luego borra la tarea
    await prisma.tareas.delete({ where: { id } });

    res.json({ mensaje: "Tarea y relación eliminadas correctamente" });
  } catch (error) {
    console.error("[❌ ERROR al eliminar tarea]:", error.message);
    res
      .status(500)
      .json({ error: "Error al eliminar tarea", detalle: error.message });
  }
});
app.delete("/st_material/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const deleted = await prisma.sT_Material.delete({
      where: { id },
    });
    res.json({ success: true, data: deleted });
  } catch (error) {
    console.error("❌ Error al eliminar ST_Material:", error);
    res.status(500).json({ error: "Error al eliminar material asignado" });
  }
});
app.delete("/presupuestos/:id", async (req, res) => {
  const id = Number(req.params.id);

  try {
    // 1. Obtener los servicios del presupuesto
    const servicios = await prisma.presupuesto_Servicio.findMany({
      where: { presupuestoId: id },
      select: { id: true },
    });

    // 2. Para cada servicio, eliminar primero los materiales de sus tareas
    for (const servicio of servicios) {
      const tareas = await prisma.presupuesto_Tarea.findMany({
        where: { presupuestoServicioId: servicio.id },
        select: { id: true },
      });

      for (const tarea of tareas) {
        await prisma.presupuesto_Material.deleteMany({
          where: { presupuestoTareaId: tarea.id },
        });
      }

      // 3. Luego eliminar las tareas del servicio
      await prisma.presupuesto_Tarea.deleteMany({
        where: { presupuestoServicioId: servicio.id },
      });
    }

    // 4. Eliminar todos los servicios del presupuesto
    await prisma.presupuesto_Servicio.deleteMany({
      where: { presupuestoId: id },
    });

    // 5. Finalmente eliminar el presupuesto
    const deleted = await prisma.presupuesto.delete({
      where: { id },
    });

    res.json({ success: true, data: deleted });
  } catch (error) {
    console.error("❌ Error al eliminar Presupuesto:", error);
    res.status(500).json({ error: "Error al eliminar Presupuesto asignado" });
  }
});
app.delete("/modulos/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await prisma.modulo.delete({ where: { id } });
    res.json({ mensaje: "Módulo eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar módulo" });
  }
});
app.delete("/servicios/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    // ✅ Verificar si hay servicios_tarea que dependen de este servicio
    const serviciosTareaExistentes = await prisma.servicios_Tarea.count({
      where: { servicioId: id },
    });

    if (serviciosTareaExistentes > 0) {
      return res.status(400).json({
        error: `No se puede eliminar el servicio. Hay ${serviciosTareaExistentes} tareas asignadas a este servicio.`,
        suggestion:
          "Elimina primero las tareas asignadas o cambia su servicio.",
      });
    }

    await prisma.servicios.delete({ where: { id } });
    res.json({ mensaje: "Servicio eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar servicio:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }

    res.status(500).json({
      error: "Error al eliminar servicio",
      detalle: error.message,
    });
  }
});
app.delete("/estados/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    // ✅ Verificar si hay tareas u obras que usan este estado
    const [tareasConEstado, obrasConEstado] = await Promise.all([
      prisma.tareas.count({ where: { estadoId: id } }),
      prisma.obra.count({ where: { estadoId: id } }),
    ]);

    if (tareasConEstado > 0 || obrasConEstado > 0) {
      return res.status(400).json({
        error: `No se puede eliminar el estado. Está siendo usado por ${tareasConEstado} tareas y ${obrasConEstado} obras.`,
        suggestion: "Cambia el estado de las tareas/obras antes de eliminar.",
      });
    }

    await prisma.estados.delete({ where: { id } });
    res.json({ mensaje: "Estado eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar estado:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Estado no encontrado" });
    }

    res.status(500).json({
      error: "Error al eliminar estado",
      detalle: error.message,
    });
  }
});
app.delete("/materiales/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    // ✅ Verificar si hay ST_Material que dependen de este material
    const stMaterialesExistentes = await prisma.sT_Material.count({
      where: { materialesId: id },
    });

    if (stMaterialesExistentes > 0) {
      return res.status(400).json({
        error: `No se puede eliminar el material. Hay ${stMaterialesExistentes} asignaciones activas.`,
        suggestion:
          "Elimina primero las asignaciones de material a servicios/tareas.",
      });
    }

    await prisma.materiales.delete({ where: { id } });
    res.json({ mensaje: "Material eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar material:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Material no encontrado" });
    }

    res.status(500).json({
      error: "Error al eliminar material",
      detalle: error.message,
    });
  }
});
app.delete("/servicios_tarea/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    // ✅ Primero eliminar los materiales asociados
    await prisma.sT_Material.deleteMany({
      where: { ServicioTareaId: id },
    });

    // ✅ Luego eliminar el servicios_tarea
    await prisma.servicios_Tarea.delete({ where: { id } });

    res.json({
      mensaje:
        "Servicios_Tarea y materiales asociados eliminados correctamente",
    });
  } catch (error) {
    console.error("❌ Error al eliminar servicios_tarea:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Servicios_Tarea no encontrado" });
    }

    res.status(500).json({
      error: "Error al eliminar servicios_tarea",
      detalle: error.message,
    });
  }
});
app.delete("/usuarios/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    // ✅ Verificar si hay servicios_tarea asignados a este usuario
    const serviciosTareaAsignados = await prisma.servicios_Tarea.count({
      where: { usuarioId: id },
    });

    if (serviciosTareaAsignados > 0) {
      return res.status(400).json({
        error: `No se puede eliminar el usuario. Tiene ${serviciosTareaAsignados} tareas asignadas.`,
        suggestion: "Reasigna las tareas a otro usuario antes de eliminar.",
      });
    }

    // ✅ Eliminar relación con directorio si existe
    await prisma.directorios.deleteMany({
      where: { usuarioId: id },
    });

    // ✅ Eliminar usuario
    await prisma.usuario.delete({ where: { id } });

    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.status(500).json({
      error: "Error al eliminar usuario",
      detalle: error.message,
    });
  }
});
app.delete("/directorios/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    await prisma.directorios.delete({ where: { id } });
    res.json({ mensaje: "Directorio eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar directorio:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Directorio no encontrado" });
    }

    res.status(500).json({
      error: "Error al eliminar directorio",
      detalle: error.message,
    });
  }
});
app.delete("/facturas/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    // ✅ Verificar que la factura no esté pagada
    const factura = await prisma.facturas.findUnique({
      where: { id },
      select: { cobrada: true, estado: true },
    });

    if (!factura) {
      return res.status(404).json({ error: "Factura no encontrada" });
    }

    if (factura.cobrada || factura.estado === "pagado") {
      return res.status(400).json({
        error: "No se puede eliminar una factura que ya está pagada",
        suggestion: "Cambia el estado a 'cancelado' en lugar de eliminar.",
      });
    }

    await prisma.facturas.delete({ where: { id } });
    res.json({ mensaje: "Factura eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar factura:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Factura no encontrada" });
    }

    res.status(500).json({
      error: "Error al eliminar factura",
      detalle: error.message,
    });
  }
});
app.delete("/branding/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    await prisma.branding.delete({ where: { id } });
    res.json({ mensaje: "Branding eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar branding:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Branding no encontrado" });
    }

    res.status(500).json({
      error: "Error al eliminar branding",
      detalle: error.message,
    });
  }
});
app.delete("/tareas/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    // ✅ Primero eliminar relaciones en servicios_tarea
    await prisma.servicios_Tarea.deleteMany({
      where: { tareaId: id },
    });

    // ✅ Luego eliminar la tarea
    await prisma.tareas.delete({ where: { id } });

    res.json({ mensaje: "Tarea eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar tarea:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }

    res.status(500).json({
      error: "Error al eliminar tarea",
      detalle: error.message,
    });
  }
});
app.delete("/materiales/all", async (req, res) => {
  try {
    // ✅ Primero eliminar todas las asignaciones
    await prisma.sT_Material.deleteMany();

    // ✅ Luego eliminar todos los materiales
    await prisma.materiales.deleteMany();

    res.json({ mensaje: "✅ Todos los materiales eliminados correctamente" });
  } catch (error) {
    console.error("[DELETE /materiales/all]", error);
    res.status(500).json({ error: "Error al eliminar todos los materiales" });
  }
});
app.delete("/servicios/all", async (req, res) => {
  try {
    // ✅ Primero eliminar servicios_tarea
    await prisma.servicios_Tarea.deleteMany();

    // ✅ Luego eliminar todos los servicios
    await prisma.servicios.deleteMany();

    res.json({ mensaje: "✅ Todos los servicios eliminados correctamente" });
  } catch (error) {
    console.error("[DELETE /servicios/all]", error);
    res.status(500).json({ error: "Error al eliminar todos los servicios" });
  }
});
//////////////////////////////////////////////////////////
//  PATH
//////////////////////////////////////////////////////////
app.patch("/servicios_tarea/:id", async (req, res) => {
  const { id } = req.params;
  const { tareaId } = req.body;

  try {
    const actualizado = await prisma.servicios_Tarea.update({
      where: { id: Number(id) },
      data: { tareaId: Number(tareaId) },
    });
    res.json(actualizado);
  } catch (err) {
    res.status(500).json({ error: "Error al asociar tarea", detalle: err });
  }
});
app.patch("/directorio/me", requireAuth, async (req, res) => {
  try {
    const idUsuario = req.user.id;
    const {
      nombre,
      apellidos,
      telefono,
      puesto,
      tipo,
      avatarUrl,
      ubicacion,
      extension,
    } = req.body;

    const actualizado = await prisma.usuario.update({
      where: { idUsuario }, // 👈 ajusta si tu PK es 'id'
      data: {
        nombre,
        apellidos,
        // ⚠️ Cambia 'directorioEmpleado' por el nombre real de tu relación en Prisma
        directorioEmpleado: {
          upsert: {
            update: { telefono, puesto, tipo, avatarUrl, ubicacion, extension },
            create: {
              telefono,
              puesto,
              tipo,
              avatarUrl,
              ubicacion,
              extension,
              usuarioId: idUsuario,
            },
          },
        },
      },
      select: {
        idUsuario: true,
        email: true,
        nombre: true,
        apellidos: true,
        rol: true,
        directorioEmpleado: true,
      },
    });

    res.json(actualizado);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al actualizar perfil" });
  }
});

//////////////////////////////////////////////////////////
// Iniciar servidor

//////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
