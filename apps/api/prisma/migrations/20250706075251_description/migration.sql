/*
  Warnings:

  - Added the required column `descripcion` to the `Presupuesto_Tarea` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Presupuesto_Tarea" ADD COLUMN     "descripcion" TEXT NOT NULL;
