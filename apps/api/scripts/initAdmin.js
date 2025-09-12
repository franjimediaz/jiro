const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function crearAdminPorDefecto() {
  console.log("▶️ Ejecutando script initAdmin.js");

  try {
    const usuarioExistente = await prisma.usuario.findFirst({
      where: { email: "admin@jiro.com" },
    });

    if (usuarioExistente) {
      console.log("✔️ Usuario admin ya existe");
      return;
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await prisma.usuario.create({
      data: {
        idUsuario: "admin1",
        nombre: "Admin",
        apellido: "Principal",
        email: "admin@jiro.com",
        telefono: "000000000",
        passwordHash: hashedPassword, // solo si tienes ese campo
      },
    });

    console.log("✅ Usuario admin creado con éxito");
  } catch (error) {
    console.error("❌ Error al crear admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

crearAdminPorDefecto();
