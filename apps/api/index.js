const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

//////////////////////////////////////////////////////////
//  Rutas para GET
//////////////////////////////////////////////////////////


app.get('/obras', async (req, res) => {
  try {
    const obras = await prisma.obra.findMany();
    res.json(obras);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener obras' });
  }
});
app.get('/clientes', async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany();
    res.json(clientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});
app.get('/obras/tareas', async (req, res) => {
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
      .filter(st => st.tarea)
      .map(st => ({
        id: st.tarea.id,
        nombre: st.tarea.nombre,
        estado: st.tarea.estado?.nombre || 'Sin estado',
        servicio: st.servicio?.nombre || '',
      }));

    res.json(tareasFormateadas); // ✅ debe devolver un array
  } catch (error) {
    console.error('Error al obtener tareas', error);
    res.status(500).json({ error: 'Error al obtener tareas' }); // ❌ Esto es lo que llega si falla
  }
});
app.get('/obras/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const obra = await prisma.obra.findUnique({ where: { id } });
    if (!obra) return res.status(404).json({ error: 'Obra no encontrada' });
    res.json(obra);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener obra' });
  }
});
app.get('/clientes/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
    });
    if (cliente) res.json(cliente);
    else res.status(404).json({ error: 'Cliente no encontrado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
});
app.get('/obras/tareas/:obraId', async (req, res) => {
  const obraId = parseInt(req.params.obraId);

  if (isNaN(obraId)) {
    return res.status(400).json({ error: 'ID de obra no válido' });
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
      .filter(st => st.tarea)
      .map(st => ({
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
    console.error('[GET /obras/tareas/:obraId] Error:', err);
    res.status(500).json({ error: 'Error al obtener tareas por obra', detalle: err.message });
  }
});
app.get('/servicios_tarea/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  console.log('📥 [GET /servicios_tarea/:id] llamada con ID:', req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID no válido' });
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
      }
    });

    if (!tarea) {
      return res.status(404).json({ error: 'No se encontró la tarea con ese ID' });
    }

    res.json(tarea);
  } catch (error) {
    console.error('[GET /servicios_tarea/:id] Error:', error);
    res.status(500).json({ error: 'Error al obtener la tarea', detalle: error.message });
  }
});
app.get('/obras/:obraId/servicios-tareas', async (req, res) => {
  const { obraId } = req.params;

  try {
    const serviciosTareas = await prisma.servicios_Tarea.findMany({
      where: { obraId: Number(obraId) },
      include: {
        servicio: true,
        tarea: true
      }
    });

    const agrupado = serviciosTareas.reduce((acc, item) => {
      const servicioId = item.servicioId;

      if (!acc[servicioId]) {
        acc[servicioId] = {
          id: servicioId,
          nombre: item.servicio.nombre,
          serviciosTarea: [] // ✅ este es el campo que espera tu frontend
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
              descripcion: item.tarea.descripcion
            }
          : null
      });

      return acc;
    }, {});

    const resultado = Object.values(agrupado);
    res.json(resultado);
  } catch (err) {
    console.error('[GET /obras/:obraId/servicios-tareas]', err);
    res.status(500).json({ error: 'Error al obtener servicios y tareas', detalle: err.message });
  }
});
app.get('/servicios', async (req, res) => {
  try {
    const servicios = await prisma.servicios.findMany({
      orderBy: { nombre: 'asc' } // Opcional: orden alfabético
    });

    res.status(200).json(servicios);
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});
app.get('/materiales', async (req, res) => {
  try {
    const materiales = await prisma.obra.findMany();
    res.json(materiales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener materiales' });
  }
});
app.get('/servicios/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const servicio = await prisma.servicios.findUnique({ where: { id } });
    if (!servicio) return res.status(404).json({ error: 'Servicio no encontrada' });
    res.json(servicio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener obra' });
  }
});
app.get('/tareas/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const tarea = await prisma.tareas.findUnique({ where: { id } });
    if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(tarea);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener obra' });
  }
});
app.get('/estados', async (req, res) => {
  try {
    const estados = await prisma.estados.findMany({
      orderBy: { nombre: 'asc' } // Opcional: orden alfabético
    });

    res.status(200).json(estados);
  } catch (error) {
    console.error('Error al obtener estados:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});
app.get('/estados/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const estado = await prisma.estados.findUnique({ where: { id } });
    if (!estado) return res.status(404).json({ error: 'Estado no encontrada' });
    res.json(estado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener estado' });
  }
});
// Eliminar una obra



//////////////////////////////////////////////////////////
//  POST
//////////////////////////////////////////////////////////

// Crear una nueva obra
app.post('/obras', async (req, res) => {
  const { nombre, direccion, fechaInicio, fechaFin, estadoId, clienteId } = req.body;

  if (!nombre || !direccion || !fechaInicio || !fechaFin || !estadoId || !clienteId) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  if (isNaN(Number(clienteId))) {
    return res.status(400).json({ error: 'clienteId no válido' });
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
    console.error('[POST /obras] Error al crear obra:', error.message);
    res.status(500).json({ error: 'Error al crear la obra', detalle: error.message });
  }
});


app.post('/clientes', async (req, res) => {
  const { nombre,apellido, direccion, email, telefono } = req.body;

  if (!nombre || !apellido || !direccion || !email || !telefono) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
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
    res.status(500).json({ error: 'Error al crear el cliente' , detalle: error.message});
  }
});
app.post('/servicios', async (req, res) => {
  try {
    const { nombre, color, icono } = req.body;

    if (!nombre || !color || !icono) {
      return res.status(400).json({ error: 'Faltan campos obligatorios.' });
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
    console.error('Error al crear servicio:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});
app.post('/obras/tareas', async (req, res) => {
  const { nombre, descripcion, estadoId } = req.body;

  try {
    const nuevaTarea = await prisma.tareas.create({
      data: {
        nombre,
        descripcion,
        estadoId,
      },
    });
    res.status(201).json(nuevaTarea);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear tarea', detalle: err });
  }
});
app.post('/servicios_tarea', async (req, res) => {
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
    return res.status(400).json({ error: 'obraId y servicioId son obligatorios' });
  }

  try {
    let tareaCreadaId = tareaId;

    // 🔹 Si no se pasó una tareaId, creamos una automáticamente
    if (!tareaId) {
      const nuevaTarea = await prisma.tarea.create({
        data: {
          nombre: 'Tarea sin título',
          descripcion: '',
          estadoId: null,
          fechaInicio: null,
          fechaFin: null
        }
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
        precioMateriales: precioMateriales ? parseFloat(precioMateriales) : undefined,
        cantidadMateriales: cantidadMateriales ? parseFloat(cantidadMateriales) : undefined,
        total: total ? parseFloat(total) : undefined,
      },
      include: {
        tarea: true // para que el frontend tenga el nombre desde el principio
      }
    });

    res.status(201).json(nuevo);
  } catch (err) {
    console.error('❌ Error al crear servicios_tarea:', err);
    res.status(500).json({ error: 'Error al vincular servicio con tarea', detalle: err.message });
  }
});

app.post('/materiales', async (req, res) => {
  try {
    const { nombre, color, icono } = req.body;

    if (!nombre || !color || !icono) {
      return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }

    const nuevoMaterial = await prisma.materiales.create({
      data: {
        nombre,
        color,
        icono,
      },
    });

    res.status(201).json(nuevoMaterial);
  } catch (error) {
    console.error('Error al crear material:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});
app.post('/modulos', async (req, res) => {
  try {
    const { nombre, ruta, icono, orden, padreId } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El campo "nombre" es obligatorio.' });
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
    console.error('Error al crear modulos:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});
app.post('/presupuestos', async (req, res) => {
  const { clienteId, obraId, nombre, descripcion } = req.body;

  if (!clienteId || !obraId || !nombre || !descripcion) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  try {
    const nuevoPresupuesto = await prisma.presupuesto.create({
      data: {
        clienteId: parseInt(clienteId),
        obraId: parseInt(obraId),
        nombre,
        descripción: descripcion,
      },
    });

    res.status(201).json(nuevoPresupuesto);
  } catch (error) {
    console.error('Error al crear presupuesto:', error);
    res.status(500).json({ error: 'Error al crear el presupuesto' });
  }
});




//////////////////////////////////////////////////////////
//  PUT
//////////////////////////////////////////////////////////
app.put('/clientes/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre,apellido, direccion, email, telefono } = req.body;

  if (!nombre ||!apellido || !direccion || !email || !telefono) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const clienteActualizado = await prisma.cliente.update({
      where: { id },
      data: { nombre,apellido, direccion, email, telefono },
    });
    res.json(clienteActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});
app.put('/obras/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, direccion, fechaInicio, fechaFin, estado, clienteId } = req.body;

  // Validación de campos obligatorios
  if (!nombre || !direccion || !fechaInicio || !fechaFin || !estado) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
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
    console.error('[PUT /obras/:id] Error:', error.message);
    res.status(500).json({ error: 'Error al actualizar obra', detalle: error.message });
  }
});
app.put('/tareas/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, descripcion, estado} = req.body;

  if (!id || !nombre) {
    return res.status(400).json({ error: 'Faltan datos para actualizar la tarea' });
  }

  try {
    const tareaActualizada = await prisma.tareas.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        estado,
      }
    });

    res.json(tareaActualizada);
  } catch (error) {
    console.error('[PUT /tareas/:id] Error al actualizar tarea:', error);
    res.status(500).json({ error: 'Error al actualizar tarea', detalle: error.message });
  }
});
app.put('/servicios_tarea/:id', async (req, res) => {
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
    total
  } = req.body;

  if (!obraId || !servicioId) {
    return res.status(400).json({ error: 'Faltan obraId y servicioId' });
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
        cantidadMateriales: cantidadMateriales ? parseFloat(cantidadMateriales) : 0,
        total: total ? parseFloat(total) : 0
      }
    });

    res.json(actualizado);
  } catch (error) {
    console.error('[PUT /servicios_tarea/:id] ❌ Error:', error);
    res.status(500).json({
      error: 'Error al actualizar vinculación servicio',
      detalle: error.message
    });
  }
});
app.put('/servicios/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre,color,icono } = req.body;

  if (!nombre ||!color ) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const servicioActualizado = await prisma.servicios.update({
      where: { id },
      data: { nombre,color, icono },
    });
    res.json(servicioActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});
app.put('/estados/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre,color,icono } = req.body;

  if (!nombre ||!color ) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const estadoActualizado = await prisma.estados.update({
      where: { id },
      data: { nombre,color, icono },
    });
    res.json(estadoActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

//////////////////////////////////////////////////////////
//  DELETE
//////////////////////////////////////////////////////////
app.delete('/clientes/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await prisma.cliente.delete({ where: { id } });
    res.json({ mensaje: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error('[❌ ERROR al eliminar cliente]:', error.message);
    res.status(500).json({ error: 'Error al eliminar cliente', detalle: error.message });
  }
});
app.delete('/obras/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await prisma.obra.delete({ where: { id } });
    res.json({ mensaje: 'Obra eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar obra' });
  }
});
app.delete('/eliminar-todo', async (req, res) => {
  try {
    // Orden importante: borra primero lo que depende de otras tablas
    await prisma.servicios_Tarea.deleteMany();
    await prisma.obra.deleteMany();
    await prisma.cliente.deleteMany();
    await prisma.usuario.deleteMany();
    await prisma.tareas.deleteMany();
    await prisma.servicios.deleteMany();
    await prisma.materiales.deleteMany();

    res.json({ mensaje: '✅ Todas las tablas fueron vaciadas correctamente' });
  } catch (error) {
    console.error('[DELETE /eliminar-todo]', error);
    res.status(500).json({ error: 'Error al eliminar todos los datos' });
  }
});
app.delete('/modulos/all', async (req, res) => {
  try {
    await prisma.modulo.deleteMany();

    res.json({ mensaje: '✅ Todas los modulos se eliminaron correctamente' });
  } catch (error) {
    console.error('[DELETE /modulos/all]', error);
    res.status(500).json({ error: 'Error al eliminar todos los datos' });
  }
});
app.delete('/obras/tareas/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    // Primero borra el registro en servicios_Tarea que usa tareaId como FK
    await prisma.servicios_Tarea.deleteMany({ where: { tareaId: id } });

    // Luego borra la tarea
    await prisma.tareas.delete({ where: { id } });

    res.json({ mensaje: 'Tarea y relación eliminadas correctamente' });
  } catch (error) {
    console.error('[❌ ERROR al eliminar tarea]:', error.message);
    res.status(500).json({ error: 'Error al eliminar tarea', detalle: error.message });
  }
});
//////////////////////////////////////////////////////////
//  PATH
//////////////////////////////////////////////////////////
app.patch('/servicios_tarea/:id', async (req, res) => {
  const { id } = req.params;
  const { tareaId } = req.body;

  try {
    const actualizado = await prisma.servicios_Tarea.update({
      where: { id: Number(id) },
      data: { tareaId: Number(tareaId) },
    });
    res.json(actualizado);
  } catch (err) {
    res.status(500).json({ error: 'Error al asociar tarea', detalle: err });
  }
});





