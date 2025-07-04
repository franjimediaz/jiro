/*
  Warnings:

  - You are about to drop the column `email` on the `Tareas` table. All the data in the column will be lost.
  - You are about to drop the column `telefono` on the `Tareas` table. All the data in the column will be lost.
  - Added the required column `apellido` to the `Cliente` table without a default value. This is not possible if the table is not empty.
  - Added the required column `descripcion` to the `Tareas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estado` to the `Tareas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `servicio` to the `Tareas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `apellido` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "apellido" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Tareas" DROP COLUMN "email",
DROP COLUMN "telefono",
ADD COLUMN     "descripcion" TEXT NOT NULL,
ADD COLUMN     "estado" TEXT NOT NULL,
ADD COLUMN     "servicio" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "apellido" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Servicios" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "icono" TEXT NOT NULL,

    CONSTRAINT "Servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Materiales" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripción" TEXT NOT NULL,
    "precio" INTEGER NOT NULL,
    "proveedor" TEXT NOT NULL,

    CONSTRAINT "Materiales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servicios_Tarea" (
    "id" SERIAL NOT NULL,
    "obraId" INTEGER NOT NULL,
    "tareaId" INTEGER NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "materialesId" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "precioManoObra" INTEGER NOT NULL,
    "cantidadMateriales" INTEGER NOT NULL,
    "precioMateriales" INTEGER NOT NULL,

    CONSTRAINT "Servicios_Tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Servicios_TareaToUsuario" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_Servicios_TareaToUsuario_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_Servicios_TareaToUsuario_B_index" ON "_Servicios_TareaToUsuario"("B");

-- AddForeignKey
ALTER TABLE "Servicios_Tarea" ADD CONSTRAINT "Servicios_Tarea_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicios_Tarea" ADD CONSTRAINT "Servicios_Tarea_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicios_Tarea" ADD CONSTRAINT "Servicios_Tarea_materialesId_fkey" FOREIGN KEY ("materialesId") REFERENCES "Materiales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servicios_Tarea" ADD CONSTRAINT "Servicios_Tarea_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tareas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Servicios_TareaToUsuario" ADD CONSTRAINT "_Servicios_TareaToUsuario_A_fkey" FOREIGN KEY ("A") REFERENCES "Servicios_Tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Servicios_TareaToUsuario" ADD CONSTRAINT "_Servicios_TareaToUsuario_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
