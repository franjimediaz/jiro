const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({ storage });

router.post('/upload', upload.single('archivo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Archivo no recibido' });

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ fileUrl });
});

router.delete('/upload', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Falta la URL del archivo' });

  const filePath = path.join(__dirname, '..', url);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Error al eliminar archivo:', err);
      return res.status(500).json({ error: 'No se pudo eliminar el archivo' });
    }

    res.json({ mensaje: 'Archivo eliminado correctamente' });
  });
});

module.exports = router;
