/*
  Warnings:

  - You are about to drop the column `dirección` on the `Branding` table. All the data in the column will be lost.
  - Added the required column `codigoPostal` to the `Branding` table without a default value. This is not possible if the table is not empty.
  - Added the required column `direccion` to the `Branding` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Branding` table without a default value. This is not possible if the table is not empty.
  - Added the required column `localidad` to the `Branding` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provincia` to the `Branding` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telefono` to the `Branding` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Branding" DROP COLUMN "dirección",
ADD COLUMN     "codigoPostal" TEXT NOT NULL,
ADD COLUMN     "direccion" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "localidad" TEXT NOT NULL,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "provincia" TEXT NOT NULL,
ADD COLUMN     "telefono" TEXT NOT NULL,
ADD COLUMN     "web" TEXT;
