/*
  Warnings:

  - You are about to drop the column `nombreServicio` on the `Presupuesto_Servicio` table. All the data in the column will be lost.
  - Added the required column `nombre` to the `Presupuesto_Servicio` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Presupuesto_Servicio" DROP COLUMN "nombreServicio",
ADD COLUMN     "nombre" TEXT NOT NULL;
