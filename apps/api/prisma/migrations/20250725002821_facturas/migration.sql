-- CreateTable
CREATE TABLE "Facturas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "color" TEXT NOT NULL,
    "icono" TEXT NOT NULL,
    "presupuestoId" INTEGER NOT NULL,

    CONSTRAINT "Facturas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Facturas" ADD CONSTRAINT "Facturas_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "Presupuesto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
