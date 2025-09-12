/*
  Warnings:

  - You are about to drop the column `descripción` on the `Presupuesto` table. All the data in the column will be lost.
  - You are about to drop the column `facturaId` on the `Presupuesto_Servicio` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Facturas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `descripcion` to the `Presupuesto` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Presupuesto_Servicio" DROP CONSTRAINT "Presupuesto_Servicio_facturaId_fkey";

-- AlterTable
ALTER TABLE "public"."Facturas" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'pendiente',
ADD COLUMN     "importe" DOUBLE PRECISION,
ADD COLUMN     "numero" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Modulo" ADD COLUMN     "activo" BOOLEAN;

-- AlterTable
ALTER TABLE "public"."Presupuesto" DROP COLUMN "descripción",
ADD COLUMN     "descripcion" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Presupuesto_Servicio" DROP COLUMN "facturaId";
