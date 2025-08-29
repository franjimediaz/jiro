/*
  Warnings:

  - Added the required column `cantidad` to the `Presupuesto_Material` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precioUnidad` to the `Presupuesto_Material` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `Presupuesto_Material` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Presupuesto_Material" ADD COLUMN     "cantidad" INTEGER NOT NULL,
ADD COLUMN     "precioUnidad" INTEGER NOT NULL,
ADD COLUMN     "total" INTEGER NOT NULL;
