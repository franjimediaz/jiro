/*
  Warnings:

  - Added the required column `facturable` to the `Presupuesto_Material` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Presupuesto_Material" ADD COLUMN     "facturable" BOOLEAN NOT NULL;
