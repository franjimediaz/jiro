/*
  Warnings:

  - Added the required column `direccion` to the `Cliente` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clienteID` to the `Obra` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "direccion" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Obra" ADD COLUMN     "clienteID" INTEGER NOT NULL;
