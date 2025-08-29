const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// POST: Crear documento
router.post('/', async (req, res) => {
  const { nombre, url, tipo, tabla, registroId } = req.body;

  if (!nombre || !url || !tipo || !tabla || !registroId) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const nuevo = await prisma.documento.create({
      data: { nombre, url, tipo, tabla, registroId: parseInt(registroId) },
    });
    res.status(201).json(nuevo);
  } catch (error) {
    console.error('Error al crear documento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET: Obtener documentos por tabla + registroId
router.get('/', async (req, res) => {
  const { tabla, registroId } = req.query;

  if (!tabla || !registroId) {
    return res.status(400).json({ error: 'Faltan parámetros de consulta' });
  }

  try {
    const docs = await prisma.documento.findMany({
      where: {
        tabla,
        registroId: Number(registroId),
      },
      orderBy: { creadoEn: 'desc' },
    });
    res.json(docs);
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await prisma.documento.findUnique({ where: { id: parseInt(id) } });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

    // Eliminar archivo físico si existe
    const rutaArchivo = path.join(__dirname, '../uploads', path.basename(doc.url));
    fs.unlink(rutaArchivo, (err) => {
      if (err) console.warn('No se pudo eliminar el archivo físico:', err.message);
    });

    // Eliminar registro en base de datos
    await prisma.documento.delete({ where: { id: parseInt(id) } });

    res.json({ mensaje: 'Documento eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    res.status(500).json({ error: 'Error al eliminar documento' });
  }
});


module.exports = router;
