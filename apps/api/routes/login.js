const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const bcrypt = require("bcrypt");
app.set("trust proxy", 1);
const jwt = require("jsonwebtoken");

router.post("/dashboard", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña obligatorios" });
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      console.log("❌ Usuario no encontrado");
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const esValido = await bcrypt.compare(password, usuario.passwordHash);
    if (!esValido) {
      console.log("❌ Contraseña incorrecta");
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { userId: usuario.idUsuario, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ✅ Guardamos el token en una cookie HttpOnly
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      //secure: process.env.NODE_ENV === "production", // solo HTTPS en producción
      //sameSite: "strict",
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000, // 1 día
    });

    console.log("✅ Usuario autenticado");
    res.json({ success: true }); // puedes devolver más campos si lo necesitas
  } catch (err) {
    console.error("❌ Error en /login:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
