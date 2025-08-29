/*
  Warnings:

  - You are about to drop the column `serviciosTareaIds` on the `Presupuesto` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Presupuesto" DROP COLUMN "serviciosTareaIds";

-- CreateTable
CREATE TABLE "Presupuesto_Tarea" (
    "id" SERIAL NOT NULL,
    "presupuestoServicioId" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precioManoObra" DOUBLE PRECISION NOT NULL,
    "unidades" DOUBLE PRECISION NOT NULL,
    "precioUnidad" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Presupuesto_Tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presupuesto_Material" (
    "id" SERIAL NOT NULL,
    "presupuestoTareaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "precioUnidad" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Presupuesto_Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presupuesto_Servicio" (
    "id" SERIAL NOT NULL,
    "presupuestoId" INTEGER NOT NULL,
    "nombreServicio" TEXT NOT NULL,
    "orden" INTEGER,

    CONSTRAINT "Presupuesto_Servicio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Presupuesto_Tarea" ADD CONSTRAINT "Presupuesto_Tarea_presupuestoServicioId_fkey" FOREIGN KEY ("presupuestoServicioId") REFERENCES "Presupuesto_Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presupuesto_Material" ADD CONSTRAINT "Presupuesto_Material_presupuestoTareaId_fkey" FOREIGN KEY ("presupuestoTareaId") REFERENCES "Presupuesto_Tarea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presupuesto_Servicio" ADD CONSTRAINT "Presupuesto_Servicio_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "Presupuesto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
