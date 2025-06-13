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
app.get('/obras', async (req, res) => {
  try {
    const obras = await prisma.obra.findMany();
    res.json(obras);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener obras' });
  }
});
app.post('/obras', async (req, res) => {
  const { nombre, direccion, fechaInicio, fechaFin, estado } = req.body;

  if (!nombre || !direccion || !fechaInicio || !fechaFin || !estado) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const nuevaObra = await prisma.obra.create({
      data: {
        nombre,
        direccion,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        estado,
      },
    });
    res.status(201).json(nuevaObra);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la obra' });
  }
});