/*
  Warnings:

  - A unique constraint covering the columns `[idUsuario]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Usuario" ALTER COLUMN "telefono" DROP NOT NULL,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_idUsuario_key" ON "Usuario"("idUsuario");
