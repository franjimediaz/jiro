/*
  Warnings:

  - You are about to drop the column `estado` on the `Obra` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `Tareas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Obra" DROP COLUMN "estado",
ADD COLUMN     "estadoId" INTEGER;

-- AlterTable
ALTER TABLE "Tareas" DROP COLUMN "estado",
ADD COLUMN     "estadoId" INTEGER;

-- CreateTable
CREATE TABLE "Estados" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "icono" TEXT NOT NULL,

    CONSTRAINT "Estados_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Obra" ADD CONSTRAINT "Obra_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "Estados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tareas" ADD CONSTRAINT "Tareas_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "Estados"("id") ON DELETE SET NULL ON UPDATE CASCADE;
