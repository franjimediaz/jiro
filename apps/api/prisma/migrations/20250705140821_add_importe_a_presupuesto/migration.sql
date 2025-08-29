/*
  Warnings:

  - Made the column `importe` on table `Presupuesto` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Presupuesto" ALTER COLUMN "importe" SET NOT NULL,
ALTER COLUMN "importe" SET DEFAULT 0,
ALTER COLUMN "importe" SET DATA TYPE DOUBLE PRECISION;
