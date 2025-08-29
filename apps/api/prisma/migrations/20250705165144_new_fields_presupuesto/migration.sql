-- AlterTable
ALTER TABLE "Presupuesto" ADD COLUMN     "descuentoTipo" TEXT NOT NULL DEFAULT 'porcentaje',
ADD COLUMN     "descuentoValor" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ivaPorcentaje" DOUBLE PRECISION NOT NULL DEFAULT 21;
