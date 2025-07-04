/*
  Warnings:

  - Made the column `estadoId` on table `Obra` required. This step will fail if there are existing NULL values in that column.
  - Made the column `estadoId` on table `Tareas` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Obra" DROP CONSTRAINT "Obra_estadoId_fkey";

-- DropForeignKey
ALTER TABLE "Tareas" DROP CONSTRAINT "Tareas_estadoId_fkey";

-- AlterTable
ALTER TABLE "Obra" ALTER COLUMN "estadoId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Tareas" ALTER COLUMN "estadoId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Obra" ADD CONSTRAINT "Obra_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "Estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tareas" ADD CONSTRAINT "Tareas_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "Estados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
