-- AlterTable
ALTER TABLE "Facturas" ADD COLUMN     "cantidad" INTEGER;

-- AlterTable
ALTER TABLE "Presupuesto_Servicio" ADD COLUMN     "facturaId" INTEGER;

-- AddForeignKey
ALTER TABLE "Presupuesto_Servicio" ADD CONSTRAINT "Presupuesto_Servicio_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Facturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
