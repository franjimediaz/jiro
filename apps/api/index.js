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
const PORT = process.env.PORT || 3001;
const frontendURL = "http://localhost:3002";

app.use(cookieParser());
app.use(
  cors({
    origin: frontendURL,
    credentials: true, // ⬅️ IMPORTANTE para usar cookies
  })
);
app.use(express.json());
app.use("/login", loginRouter);

// ✅ Servir archivos estáticos desde /uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Rutas API
app.use("/api/upload", uploadRoutes); // subida real: POST /api/upload
app.use("/api/documentos", documentosRoutes);
app.use("/api", uploadRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

//////////

const verificarToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Token requerido" });

  try {
    const token = auth.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (e) {
    return res.status(403).json({ error: "Token inválido" });
  }
};

const soloAdmin = (req, res, next) => {
  if (req.usuario.rol !== "admin") {
    return res
      .status(403)
      .json({ error: "Acceso restringido a administradores" });
  }
  next();
};

//////////////////////////////////////////////////////////
//  Rutas para GET
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
    const usuarios = await prisma.usuario.findMany();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});
app.get("/usuarios/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    console.log("🧪 Buscando usuario con ID:", id);
    const usuario = await prisma.usuario.findUnique({ where: { id } });

    if (!usuario)
      return res.status(404).json({ error: "Usuario no encontrado" });

    res.json(usuario); // 👈 Asegúrate de que se devuelve directo
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
// Eliminar una obra

//////////////////////////////////////////////////////////
//  POST
//////////////////////////////////////////////////////////

// Crear una nueva obra
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

app.post("/clientes", async (req, res) => {
  const { nombre, apellido, direccion, email, telefono } = req.body;

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
app.post("/presupuestos", async (req, res) => {
  const { clienteId, obraId, nombre, descripcion, condiciones } = req.body;

  try {
    console.log("🟢 Iniciando creación de presupuesto");
    // 1️⃣ Buscar todos los servicios_tarea relacionados con la obra
    const serviciosTarea = await prisma.servicios_Tarea.findMany({
      where: { obraId: Number(obraId) },
      include: {
        servicio: true,
        tarea: true,
        stMateriales: {
          include: {
            material: true, // incluir datos del material
          },
        },
      },
    });

    // 2️⃣ Calcular base imponible (sumando `total` de cada línea de servicio_tarea)
    const baseImponible = serviciosTarea.reduce(
      (acc, st) => acc + (st.total || 0),
      0
    );
    const importe = parseFloat((baseImponible * 1.21).toFixed(2));

    // 3️⃣ Crear el presupuesto
    const nuevoPresupuesto = await prisma.presupuesto.create({
      data: {
        clienteId: Number(clienteId),
        obraId: Number(obraId),
        nombre,
        descripción: descripcion,
        importe,
        condiciones,
      },
    });

    // 4️⃣ Agrupar por servicioId y crear snapshot
    const serviciosUnicos = [
      ...new Set(serviciosTarea.map((st) => st.servicioId)),
    ];

    for (const servicioId of serviciosUnicos) {
      const tareasServicio = serviciosTarea.filter(
        (st) => st.servicioId === servicioId
      );
      const nombreServicio =
        tareasServicio[0]?.servicio?.nombre || "Servicio sin nombre";
      console.log("➕ Añadiendo servicio al snapshot:", nombreServicio);
      const servicioPresupuesto = await prisma.presupuesto_Servicio.create({
        data: {
          presupuestoId: nuevoPresupuesto.id,
          servicioId,
          nombre: nombreServicio,
        },
      });

      for (const st of tareasServicio) {
        const nombreTarea = st.tarea?.nombre || "Tarea sin nombre";
        console.log("  ↪ Añadiendo tarea:", nombreTarea);
        const tareaPresupuesto = await prisma.presupuesto_Tarea.create({
          data: {
            presupuestoServicioId: servicioPresupuesto.id,
            tareaId: st.tarea?.id ?? null,
            nombre: nombreTarea,
            descripcion: st.tarea?.descripcion ?? "Sin descripción",
            precioManoObra: st.precioManoObra ?? 0,
            total: st.total ?? 0,
            cantidad: st.cantidadMateriales ?? 1,
            totalMateriales: st.precioMateriales ?? 0,
          },
        });

        // Recorrer los materiales desde st_material
        for (const stMat of st.stMateriales) {
          const nombreMaterial =
            stMat.material?.nombre || "Material sin nombre";
          console.log("    ↪ Añadiendo material:", nombreMaterial);
          await prisma.presupuesto_Material.create({
            data: {
              presupuestoTareaId: tareaPresupuesto.id,
              nombre: nombreMaterial,
              cantidad: stMat.cantidad,
              precioUnidad: stMat.preciounidad,
              total: stMat.total,
              facturable: stMat.facturable,
            },
          });
        }
      }
    }

    res.json(nuevoPresupuesto);
  } catch (error) {
    console.error("❌ Error al crear el presupuesto:", error);
    res.status(500).json({ error: "Error al crear el presupuesto" });
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
    rol = "operario",
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
        rol,
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
    const nuevaReferencia = `F-${presupuestoId}-${facturasExistentes.length + 1}`;

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
//  POST Login
//////////////////////////////////////////////////////////
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña obligatorios" });
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario || !usuario.activo) {
      return res
        .status(401)
        .json({ error: "Usuario no encontrado o inactivo" });
    }

    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValida) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Generar token
    const token = jwt.sign(
      { id: usuario.idUsuario, rol: usuario.rol },
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
        id: usuario.idUsuario,
        nombre: usuario.nombre,
        rol: usuario.rol,
        email: usuario.email,
      },
    });
  } catch (err) {
    console.error("❌ Error en login:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

//////////////////////////////////////////////////////////
//  PUT
//////////////////////////////////////////////////////////
app.put("/clientes/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, apellido, direccion, email, telefono } = req.body;

  if (!nombre || !apellido || !direccion || !email || !telefono) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    const clienteActualizado = await prisma.cliente.update({
      where: { id },
      data: { nombre, apellido, direccion, email, telefono },
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
  const { nombre, descripcion, estado, progreso } = req.body;

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
    precioManoObra,
    precioMateriales,
    cantidadMateriales,
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
        fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        precioManoObra: precioManoObra ? parseFloat(precioManoObra) : 0,
        precioMateriales: precioMateriales ? parseFloat(precioMateriales) : 0,
        cantidadMateriales: cantidadMateriales
          ? parseFloat(cantidadMateriales)
          : 0,
        total: total ? parseFloat(total) : 0,
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

//////////////////////////////////////////////////////////
//  DELETE
//////////////////////////////////////////////////////////
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
