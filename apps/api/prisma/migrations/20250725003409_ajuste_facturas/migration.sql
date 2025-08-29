/*
  Warnings:

  - You are about to drop the column `color` on the `Facturas` table. All the data in the column will be lost.
  - You are about to drop the column `icono` on the `Facturas` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `Facturas` table. All the data in the column will be lost.
  - Added the required column `referencia` to the `Facturas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Facturas" DROP COLUMN "color",
DROP COLUMN "icono",
DROP COLUMN "nombre",
ADD COLUMN     "cobrada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referencia" TEXT NOT NULL;
